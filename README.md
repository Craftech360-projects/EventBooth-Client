# Event Booth

Event Booth is a web application for clients to request services for events. Clients can create events, request services, and manage their service requests.

## Features

- Google Sign-In Authentication
- Dashboard with quick overview of requests and events
- Event management with filtering options
- Authentication code generation for events
- Service request management
- User profile management

## Technologies Used

- React + Vite
- Firebase (Authentication, Firestore)
- Material-UI
- React Router
- OTPlib for authentication code generation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
2. Install dependencies
3. Create a Firebase project and enable:
- Authentication (Google provider)
- Firestore Database

4. Update the Firebase configuration in `src/firebase/config.js` with your Firebase project details

5. Start the development server:

## Project Structure

- `/src`: Source code
- `/components`: Reusable UI components
- `/contexts`: React context providers
- `/firebase`: Firebase configuration
- `/hooks`: Custom React hooks
- `/pages`: Application pages
- `/utils`: Utility functions

## Subscription Model

- $10 subscription provides 60 service requests
- Clients can use requests to create events and request services
- Each service request deducts from the available requests

## Authentication Code

Each event has a unique authentication code that:
- Is a 6-digit code
- Refreshes every minute
- Works similar to Google Authenticator