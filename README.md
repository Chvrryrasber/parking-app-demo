# Parking Management Web Application (Frontend Demo)

A web-based Parking Management System designed to simulate real-world parking operations with role-based dashboards, interactive data visualization, and clean UI workflows.

This repository contains the **frontend demo version**, deployed using GitHub Pages.  
The project is built to showcase frontend architecture, state handling, and data-driven UI behavior.

**Live Demo:**  
https://<chvrryrasber>.github.io/parking-app-demo/

-----------------------------------------------------------------------------------

## Project Overview

The application models a real-world parking system with two primary roles:

- **User**: Browse parking lots, book and release parking spots, and track usage
- **Admin**: Manage parking lots and monitor system-wide occupancy metrics

The demo runs entirely on the frontend using simulated data, while a **fully implemented Flask backend (REST APIs)** exists separately for local development.

--------------------------------------------------------------------------------------

## Key Features

### User Dashboard
- View available parking lots with pricing and availability
- Simulate booking and releasing parking spots
- Track active and completed reservations
- Visualize activity and spending through interactive charts

### Admin Dashboard
- Monitor total, available, and occupied parking spots
- Add and remove parking lots (demo simulation)
- Compare occupancy across parking locations
- Data-driven charts for system-level insights

-----------------------------------------------------------------------------

## Demo Mode Details

- Runs without a backend (GitHub Pages compatible)
- All actions are simulated in-memory
- State updates reflect immediately in UI and charts
- Designed for demonstration 

### Demo Credentials

**User**
Username: user
Password: user


**Admin**
Username: admin
Password: admin

------------------------------------------------------------------------

## Technical Highlights

- Role-based UI flow (User / Admin)
- Reactive state updates without page reloads
- Chart-driven dashboards for usage insights
- Clean separation of UI logic and data handling
- Frontend structured for easy backend reintegration

--------------------------------------------------------------------------

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Framework:** Vue.js
- **UI Library:** Bootstrap 5
- **Data Visualization:** Chart.js
- **Hosting:** GitHub Pages
- **Backend (separate):** Flask (REST APIs)

--------------------------------------------------------------------------

## Metrics (Demo Scope)

- Simulates multiple parking lots with dynamic availability
- Handles role-based dashboards and actions
- Renders multiple chart types (bar, pie, doughnut)
- Supports end-to-end user flows in demo mode

--------------------------------------------------------------------------


## Notes

- This repository hosts **frontend only**
- Backend services are intentionally disabled for public deployment

--------------------------------------------------------------------------


## Author
**Yashvardhan Tomar**  


