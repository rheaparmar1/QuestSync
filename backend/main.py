import base64
import json
import os
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import anthropic
from icalendar import Calendar, Event
import pytz

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")
    return anthropic.Anthropic(api_key=api_key)


OUTLINE_PROMPT = (
    "You are a university calendar assistant. Parse this course outline and extract every assessment, "
    "exam, midterm, quiz, assignment, and project. Return ONLY a JSON array with no markdown, no explanation. "
    "Each item: {course_code, event_name, date (YYYY-MM-DD or null if TBD), time (HH:MM or null), "
    "location (or null), type (exam/midterm/assignment/quiz/project), is_tbd (true if date is TBD or unknown)}"
)

SCHEDULE_PROMPT = (
    "You are a university calendar assistant. Parse this Quest schedule screenshot and extract every course section. "
    "Return ONLY a JSON array with no markdown, no explanation. "
    "Each item: {course_code, section, type (lecture or tutorial), days (array of full day names), "
    "start_time (HH:MM 24hr), end_time (HH:MM 24hr), location, start_date (use 2026-05-05), end_date (use 2026-08-01)}"
)


@app.post("/parse-outline")
async def parse_outline(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    b64 = base64.standard_b64encode(contents).decode("utf-8")
    client = get_client()

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": b64,
                            },
                        },
                        {"type": "text", "text": OUTLINE_PROMPT},
                    ],
                }
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")

    raw = message.content[0].text.strip()
    try:
        events = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="Could not parse the outline. Please try a cleaner PDF.",
        )

    return {"events": events}


@app.post("/parse-schedule")
async def parse_schedule(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    content_type = file.content_type or "image/png"
    if content_type not in ("image/png", "image/jpeg", "image/gif", "image/webp"):
        content_type = "image/png"

    b64 = base64.standard_b64encode(contents).decode("utf-8")
    client = get_client()

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
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
    if req.include_assessments:
        for ev in req.events:
            if ev.get("is_tbd"):
                continue
            ev_date = ev.get("date")
            if not ev_date:
                continue
            try:
                d = datetime.strptime(ev_date, "%Y-%m-%d").date()
            except ValueError:
                continue

            ical_event = Event()
            course = ev.get("course_code", "")
            name = ev.get("event_name", "")
            ical_event.add("summary", f"{course} — {name}")

            ev_time = parse_time(ev.get("time"))
            if ev_time:
                start_dt = tz.localize(datetime.combine(d, ev_time))
                end_dt = start_dt + timedelta(hours=2)
                ical_event.add("dtstart", start_dt)
                ical_event.add("dtend", end_dt)
            else:
                ical_event.add("dtstart", d)
                ical_event.add("dtend", d + timedelta(days=1))

            loc = ev.get("location")
            if loc:
                ical_event.add("location", loc)
            ical_event.add("description", f"{course} | {ev.get('type', '')}")
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
        if section:
            summary = f"{course} {label} {section}"

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
                ical_event.add(
                    "description",
                    f"{course} | {sec_type.capitalize()} | Section {section}",
                )
                cal.add_component(ical_event)

    ics_bytes = cal.to_ical()
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="uw-schedule.ics"'},
    )
