import base64
import json
import os
import re
from datetime import datetime, timedelta, date
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# Allow OAuth over HTTP for local development
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, RedirectResponse
from pydantic import BaseModel
import anthropic
from icalendar import Calendar, Event
import pytz
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

app = FastAPI()

_frontend_url = os.environ.get("FRONTEND_URL", "")
_allow_origins = ["http://localhost:5173", "http://localhost:3000"]
if _frontend_url:
    _allow_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client(user_key: Optional[str] = None):
    api_key = user_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="No API key provided. Please enter your Claude API key.")
    return anthropic.Anthropic(api_key=api_key)


OUTLINE_PROMPT = (
    "You are a university calendar assistant. Parse this course outline and extract every assessment, "
    "exam, midterm, quiz, assignment, and project. Return ONLY a JSON array with no markdown, no explanation. "
    "Each item: {course_code, event_name, date (YYYY-MM-DD or null if TBD), start_time (HH:MM 24hr or null), "
    "end_time (HH:MM 24hr or null), location (or null), type (exam/midterm/assignment/quiz/project), "
    "is_tbd (true if date is TBD or unknown)}"
)

SCHEDULE_PROMPT = (
    "You are a university calendar assistant. Parse this Quest schedule screenshot and extract every course section. "
    "Return ONLY a JSON array with no markdown, no explanation. "
    "Each item: {course_code, section, type (lecture or tutorial), days (array of full day names), "
    "start_time (HH:MM 24hr), end_time (HH:MM 24hr), location, professor (instructor name or null), "
    "start_date (use 2026-05-05), end_date (use 2026-08-01)}"
)


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._skip = False
        self._parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "head"):
            self._skip = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "head"):
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            stripped = data.strip()
            if stripped:
                self._parts.append(stripped)

    def get_text(self) -> str:
        return "\n".join(self._parts)


def _strip_html(raw: str) -> str:
    parser = _TextExtractor()
    parser.feed(raw)
    text = parser.get_text()
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _is_html(file: UploadFile) -> bool:
    name = (file.filename or "").lower()
    ct = (file.content_type or "").lower()
    return name.endswith(".html") or name.endswith(".htm") or "html" in ct


@app.post("/parse-outline")
async def parse_outline(file: UploadFile = File(...), x_claude_key: Optional[str] = Header(None)):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    client = get_client(x_claude_key)

    if _is_html(file):
        text = _strip_html(contents.decode("utf-8", errors="replace"))
        content_blocks = [
            {"type": "text", "text": f"Course outline:\n\n{text}"},
            {"type": "text", "text": OUTLINE_PROMPT},
        ]
    else:
        b64 = base64.standard_b64encode(contents).decode("utf-8")
        content_blocks = [
            {
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": b64},
            },
            {"type": "text", "text": OUTLINE_PROMPT},
        ]

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": content_blocks}],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")

    raw = message.content[0].text.strip()
    try:
        events = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="Could not parse the outline. Please try a cleaner PDF or HTML file.",
        )

    return {"events": events}


@app.post("/parse-schedule")
async def parse_schedule(file: UploadFile = File(...), x_claude_key: Optional[str] = Header(None)):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    content_type = file.content_type or "image/png"
    if content_type not in ("image/png", "image/jpeg", "image/gif", "image/webp"):
        content_type = "image/png"

    b64 = base64.standard_b64encode(contents).decode("utf-8")
    client = get_client(x_claude_key)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": content_type,
                                "data": b64,
                            },
                        },
                        {"type": "text", "text": SCHEDULE_PROMPT},
                    ],
                }
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")

    raw = message.content[0].text.strip()
    try:
        sections = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="Could not parse the schedule screenshot. Please try a cleaner image.",
        )

    return {"sections": sections}


class GenerateIcsRequest(BaseModel):
    events: list
    sections: list
    include_lectures: bool = True
    include_tutorials: bool = True
    include_assessments: bool = True
    include_assignments: bool = True
    color_code: bool = True
    custom_colors: dict = {}
    calendar_id: str = "primary"


EVENT_COLORS = {
    "exam":       "#EF4444",
    "midterm":    "#F97316",
    "assignment": "#3B82F6",
    "quiz":       "#A855F7",
    "lecture":    "#9CA3AF",
    "tutorial":   "#6366F1",
}

EXAM_TYPES = {"exam", "midterm", "quiz"}
ASSIGNMENT_TYPES = {"assignment", "project"}


def _ics_color(ev_type: str, custom_colors: dict) -> str:
    key = "assignment" if ev_type in ASSIGNMENT_TYPES else ev_type
    return custom_colors.get(key) or EVENT_COLORS.get(key, "")

# Google Calendar color IDs (predefined palette)
GOOGLE_COLOR_IDS = {
    "exam":       "11",  # Tomato
    "midterm":    "6",   # Tangerine
    "assignment": "7",   # Peacock
    "quiz":       "3",   # Grape
    "project":    "2",   # Sage
    "lecture":    "8",   # Graphite
    "tutorial":   "9",   # Blueberry
}

RRULE_DAYS = {
    "monday": "MO", "tuesday": "TU", "wednesday": "WE",
    "thursday": "TH", "friday": "FR", "saturday": "SA", "sunday": "SU",
}

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
]
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

_google_credentials = None
_google_flow = None


def _google_client_config() -> dict:
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(500, "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set in .env")
    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }


def _google_service():
    global _google_credentials
    if not _google_credentials:
        raise HTTPException(401, "Not connected to Google Calendar. Please connect first.")
    if _google_credentials.expired and _google_credentials.refresh_token:
        _google_credentials.refresh(GoogleRequest())
    return build("calendar", "v3", credentials=_google_credentials)


@app.get("/auth/google")
async def google_auth():
    global _google_flow
    _google_flow = Flow.from_client_config(
        _google_client_config(), scopes=GOOGLE_SCOPES, redirect_uri=GOOGLE_REDIRECT_URI
    )
    auth_url, _ = _google_flow.authorization_url(prompt="consent", access_type="offline")
    return RedirectResponse(auth_url)


@app.get("/auth/google/callback")
async def google_callback(code: str):
    global _google_credentials, _google_flow
    if not _google_flow:
        raise HTTPException(400, "OAuth flow not initialised — please try connecting again.")
    _google_flow.fetch_token(code=code)
    _google_credentials = _google_flow.credentials
    _google_flow = None
    return RedirectResponse(f"{FRONTEND_URL}/?google_auth=1")


@app.get("/auth/google/status")
async def google_status():
    return {"authenticated": _google_credentials is not None}


@app.get("/auth/google/calendars")
async def list_calendars():
    service = _google_service()
    result = service.calendarList().list().execute()
    calendars = [
        {"id": c["id"], "name": c["summary"], "primary": c.get("primary", False)}
        for c in result.get("items", [])
        if c.get("accessRole") in ("owner", "writer")
    ]
    return {"calendars": calendars}


@app.post("/upload-to-google")
async def upload_to_google(req: GenerateIcsRequest):
    service = _google_service()
    tz_str = "America/Toronto"
    created = 0

    for ev in req.events:
        if ev.get("is_tbd") or not ev.get("date"):
            continue
        ev_type = ev.get("type", "")
        if ev_type in EXAM_TYPES and not req.include_assessments:
            continue
        if ev_type in ASSIGNMENT_TYPES and not req.include_assignments:
            continue
        try:
            d = datetime.strptime(ev["date"], "%Y-%m-%d").date()
        except ValueError:
            continue

        course = ev.get("course_code", "")
        name = ev.get("event_name", "")
        body: dict = {
            "summary": f"{course} — {name}",
            "description": f"{course} | {ev_type}",
        }
        if ev.get("location"):
            body["location"] = ev["location"]

        start_t = ev.get("start_time")
        end_t = ev.get("end_time")
        if start_t:
            end_str = (
                f"{d}T{end_t}:00"
                if end_t
                else (datetime.strptime(f"{d}T{start_t}:00", "%Y-%m-%dT%H:%M:%S") + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%S")
            )
            body["start"] = {"dateTime": f"{d}T{start_t}:00", "timeZone": tz_str}
            body["end"] = {"dateTime": end_str, "timeZone": tz_str}
        else:
            body["start"] = {"date": str(d)}
            body["end"] = {"date": str(d + timedelta(days=1))}

        gcal_key = "assignment" if ev_type in ASSIGNMENT_TYPES else ev_type
        if req.color_code and gcal_key in GOOGLE_COLOR_IDS:
            body["colorId"] = GOOGLE_COLOR_IDS[gcal_key]

        service.events().insert(calendarId=req.calendar_id, body=body).execute()
        created += 1

    for sec in req.sections:
        sec_type = sec.get("type", "").lower()
        if sec_type == "lecture" and not req.include_lectures:
            continue
        if sec_type == "tutorial" and not req.include_tutorials:
            continue

        start_t = sec.get("start_time")
        end_t = sec.get("end_time")
        days = sec.get("days", [])
        if not start_t or not end_t or not days:
            continue

        try:
            start_date = datetime.strptime(sec.get("start_date", "2026-05-05"), "%Y-%m-%d").date()
            end_date = datetime.strptime(sec.get("end_date", "2026-08-01"), "%Y-%m-%d").date()
        except ValueError:
            start_date = date(2026, 5, 5)
            end_date = date(2026, 8, 1)

        # Find the earliest first occurrence across all days
        first_occ = None
        for day_name in days:
            for occ in date_range_for_day(day_name, start_date, end_date):
                if first_occ is None or occ < first_occ:
                    first_occ = occ
                break  # only need the first occurrence per day

        if not first_occ:
            continue

        byday = ",".join(RRULE_DAYS[d.lower()] for d in days if d.lower() in RRULE_DAYS)
        rrule = f"RRULE:FREQ=WEEKLY;BYDAY={byday};UNTIL={end_date.strftime('%Y%m%dT000000Z')}"

        course = sec.get("course_code", "")
        section = sec.get("section", "")
        label = "LEC" if sec_type == "lecture" else "TUT"
        prof = sec.get("professor")
        desc = f"{sec_type.capitalize()} - Section {section}"
        if prof:
            desc += f"\n{prof}"

        body = {
            "summary": f"{course} {label}",
            "description": desc,
            "recurrence": [rrule],
            "start": {"dateTime": f"{first_occ}T{start_t}:00", "timeZone": tz_str},
            "end": {"dateTime": f"{first_occ}T{end_t}:00", "timeZone": tz_str},
        }
        if sec.get("location"):
            body["location"] = sec["location"]
        if req.color_code and sec_type in GOOGLE_COLOR_IDS:
            body["colorId"] = GOOGLE_COLOR_IDS[sec_type]

        service.events().insert(calendarId=req.calendar_id, body=body).execute()
        created += 1

    return {"created": created}


DAY_MAP = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def date_range_for_day(day_name: str, start_date: date, end_date: date):
    target_weekday = DAY_MAP.get(day_name.lower())
    if target_weekday is None:
        return []
    current = start_date
    results = []
    days_ahead = (target_weekday - current.weekday()) % 7
    current = current + timedelta(days=days_ahead)
    while current <= end_date:
        results.append(current)
        current += timedelta(weeks=1)
    return results


def parse_time(t: Optional[str]):
    if not t:
        return None
    try:
        return datetime.strptime(t, "%H:%M").time()
    except ValueError:
        return None


@app.post("/generate-ics")
async def generate_ics(req: GenerateIcsRequest):
    cal = Calendar()
    cal.add("prodid", "-//UW Course Calendar//EN")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")

    tz = pytz.timezone("America/Toronto")

    # Add assessment events
    for ev in req.events:
        if ev.get("is_tbd"):
            continue
        ev_date = ev.get("date")
        if not ev_date:
            continue
        ev_type = ev.get("type", "")
        if ev_type in EXAM_TYPES and not req.include_assessments:
            continue
        if ev_type in ASSIGNMENT_TYPES and not req.include_assignments:
            continue
        try:
            d = datetime.strptime(ev_date, "%Y-%m-%d").date()
        except ValueError:
            continue

        ical_event = Event()
        course = ev.get("course_code", "")
        name = ev.get("event_name", "")
        ical_event.add("summary", f"{course} — {name}")

        start_t = parse_time(ev.get("start_time"))
        end_t = parse_time(ev.get("end_time"))
        if start_t:
            start_dt = tz.localize(datetime.combine(d, start_t))
            end_dt = tz.localize(datetime.combine(d, end_t)) if end_t else start_dt + timedelta(hours=2)
            ical_event.add("dtstart", start_dt)
            ical_event.add("dtend", end_dt)
        else:
            ical_event.add("dtstart", d)
            ical_event.add("dtend", d + timedelta(days=1))

        loc = ev.get("location")
        if loc:
            ical_event.add("location", loc)
        ical_event.add("description", f"{course} | {ev_type}")
        if req.color_code:
            color = _ics_color(ev_type, req.custom_colors)
            if color:
                ical_event.add("color", color)
                ical_event["X-APPLE-CALENDAR-COLOR"] = color
        cal.add_component(ical_event)

    # Add recurring class events
    for sec in req.sections:
        sec_type = sec.get("type", "").lower()
        if sec_type == "lecture" and not req.include_lectures:
            continue
        if sec_type == "tutorial" and not req.include_tutorials:
            continue

        try:
            start_date = datetime.strptime(sec.get("start_date", "2026-05-05"), "%Y-%m-%d").date()
            end_date = datetime.strptime(sec.get("end_date", "2026-08-01"), "%Y-%m-%d").date()
        except ValueError:
            start_date = date(2026, 5, 5)
            end_date = date(2026, 8, 1)

        start_t = parse_time(sec.get("start_time"))
        end_t = parse_time(sec.get("end_time"))
        if not start_t or not end_t:
            continue

        course = sec.get("course_code", "")
        section = sec.get("section", "")
        label = "LEC" if sec_type == "lecture" else "TUT"
        summary = f"{course} {label}"

        days = sec.get("days", [])
        for day_name in days:
            for occurrence in date_range_for_day(day_name, start_date, end_date):
                ical_event = Event()
                ical_event.add("summary", summary)
                start_dt = tz.localize(datetime.combine(occurrence, start_t))
                end_dt = tz.localize(datetime.combine(occurrence, end_t))
                ical_event.add("dtstart", start_dt)
                ical_event.add("dtend", end_dt)
                loc = sec.get("location")
                if loc:
                    ical_event.add("location", loc)
                prof = sec.get("professor")
                desc = f"{sec_type.capitalize()} - Section {section}"
                if prof:
                    desc += f"\n{prof}"
                ical_event.add("description", desc)
                if req.color_code:
                    color = EVENT_COLORS.get(sec_type, "")
                    if color:
                        ical_event.add("color", color)
                        ical_event["X-APPLE-CALENDAR-COLOR"] = color
                cal.add_component(ical_event)

    ics_bytes = cal.to_ical()
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="uw-schedule.ics"'},
    )
