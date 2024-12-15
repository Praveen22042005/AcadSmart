# AcadSmart

## Project Overview
AcadSmart is an academic management system designed to streamline the process of managing and viewing faculty publications. The system features two distinct user interfaces: one for faculty members and one for university administrators.

## Key Features

### Faculty Interface
- **Login**: Faculty members can log in using their credentials.
- **Automatic Fetching**: The system automatically fetches faculty paper and patent publications from online sources.
- **Manual Entry**: Faculty can manually add their publications if they are not automatically fetched.
- **Dashboard**: A user-friendly dashboard that displays all publications in an organized manner.

### University Interface
- **Login**: University administrators can log in using their credentials.
- **Search Faculty**: Administrators can search for faculty members by name.
- **View Publications**: Administrators can view the publications of faculty members in a well-organized dashboard.
- **Analytics**: The dashboard provides analytics and insights into the publications.

## Pages & Functionality

### Login Page
- Role-based authentication (Faculty/University)
- Secure login with JWT
- Password reset functionality

### Faculty Dashboard
- Overview of all publications
- Automatic fetching of publications
- Manual entry of publications
- Organized display of papers and patents

### University Dashboard
- Search functionality to find faculty members
- Detailed view of faculty publications
- Organized and categorized display of publications
- Analytics and insights

## Technology Stack
- Frontend: React.js
- Backend: Node.js & Express
- Database: MongoDB
- Authentication: JWT
- UI Framework: Material-UI

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn