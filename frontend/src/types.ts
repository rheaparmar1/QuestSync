export interface AssessmentEvent {
  course_code: string
  event_name: string
  date: string | null
  time: string | null
  location: string | null
  type: 'exam' | 'midterm' | 'assignment' | 'quiz' | 'project'
  is_tbd: boolean
}

export interface CourseSection {
  course_code: string
  section: string
  type: 'lecture' | 'tutorial'
  days: string[]
  start_time: string
  end_time: string
  location: string
  start_date: string
  end_date: string
}
