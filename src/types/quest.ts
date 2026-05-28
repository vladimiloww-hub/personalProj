export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Submission {
  id: string
  locationId: string
  sessionId: string
  photoUrl: string
  status: SubmissionStatus
  submittedAt: string
  reviewedAt: string | null
}

export interface Location {
  id: string
  name: string
  description: string
  taskDescription: string
  lat: number
  lng: number
  referencePhotoUrl: string
  order: number
  createdAt: string
}

export interface SubmissionWithLocation extends Submission {
  location: Location
  nickname?: string
}
