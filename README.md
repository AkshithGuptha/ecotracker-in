
# EcoTrackr - Carbon Footprint Tracking Platform
<div style="display: flex; align-items: center;">
  <img src="https://res.cloudinary.com/dvdvowfr2/image/upload/v1760335557/Screenshot_2025-10-13_113538_macowh.png" alt="icon" style="height:100px;width:100px;">
</div>

## Table of Contents
- [Introduction](#Abstract) <br>
- [Requirements](#requirements) <br>
- [How to use](#installation-and-usage) <br>
- [Preview](#previews) <br>
- [Team](#team-details) <br>
- [Contribution](#contribution) <br>
- [Improvements](#improvements)

## Abstract
<p text-align="left">
EcoTrackr is a web-based carbon footprint tracking platform designed to empower individuals to monitor, analyze, and reduce their daily carbon emissions. By logging everyday activities such as transportation, electricity consumption, and dietary choices, users gain real-time insights into their CO₂ output along with personalized sustainability recommendations.
The system dynamically compares emissions across consecutive days, rewarding users with points for reduced emissions and deducting points when emissions increase. These accumulated points can be redeemed at partnered eco-friendly stores or through collaborations with NGOs, promoting sustainable living through tangible incentives.
Beyond individual tracking, EcoTrackr enables event organizers to host eco-awareness programs and provides NGOs with a platform to showcase sustainable products. Through its interactive dashboard, carbon analytics, and gamified reward system, EcoTrackr transforms environmental awareness into measurable, actionable change—fostering a culture of responsibility, community participation, and greener living.
</p>

## Requirements
|||
|--|--|
| Node.js | >= 18.0.0 (for backend server) |
| MongoDB | >= 4.4 (for database) |
| Modern Browser | Chrome, Firefox, Edge — latest stable |

## Installation and usage

Follow these steps to run the project locally:

```bash
# Clone the repository
git clone https://github.com/AkshithGuptha/ecotracker-in.git

# Move into the project folder (the repo's working directory)
cd ecotracker-in

# Install dependencies listed in package.json so the project can build and run
npm install

# Create a local environment file from the example (stores secrets and configuration)
cp .env.example .env

# Edit .env with your configuration
# Open .env in a text editor and set values like DB connection string, PORT, API keys, and any other variables required by the app
# Make sure you do NOT commit real secrets to git; use safe values for local development
# Example: set MONGODB_URI=mongodb://localhost:27017/ecotrack and PORT=5000 if those are expected
# Save the file after updating the variables.

# Start MongoDB (make sure it's running)
# If you have MongoDB installed locally, run mongod in a separate terminal to start the database process.
# Alternatively, if you use MongoDB Atlas, ensure MONGODB_URI in .env points to it and that network access is allowed.
mongod

# Start the frontend development server
npm run dev

# In a second terminal, start the backend API
npm run dev:server

# Access the application
# Frontend: http://localhost:5173
# Open this URL in your browser to view the client-side UI (usually served by Vite or similar dev server).
# Backend API: http://localhost:5000
# The backend REST endpoints (Express) will typically be available here for API requests; use Postman or browser to test routes.
```


## Previews
Screenshots of the project<br>
<img src="https://res.cloudinary.com/dvdvowfr2/image/upload/v1760335092/Screenshot_2025-10-13_112613_qpi3wo.png">
<img src="https://res.cloudinary.com/dvdvowfr2/image/upload/v1760335088/Screenshot_2025-10-13_112652_iwkydu.png">
<img src="https://res.cloudinary.com/dvdvowfr2/image/upload/v1760335087/Screenshot_2025-10-13_112735_bdb4pe.png">

## Team details

<b>Team Number: </b><p>25AACR18</p>
<b>Senior Mentor:</b><p>Alekhya</p>
<b>Junior Mentor:</b><p>Premendhar</p>
<b>Team Member 1:</b><p>Kamatala Akshithguptha</p>
<b>Team Member 2:</b><p>Vimalanvitha</p>
<b>Team Member 4:</b><p>Varshini</p>
<b>Team Member 5:</b><p>Hasini</p>
<b>Team Member 3:</b><p>Hemanth</p>




## Contribution
1. Before choosing to propose changes to this project, it is advisable to go through the readme.md file of the project to get the philosophy and the motive that went behind this project. The pull request should align with the philosophy and the motive of the original poster of this project.
2. To add your changes, make sure that the programming language in which you are proposing the changes should be the same as the programming language that has been used in the project. The versions of the programming language and the libraries(if any) used should also match with the original code.
3. Write a documentation on the changes that you are proposing. The documentation should include the problems you have noticed in the code(if any), the changes you would like to propose, the reason for these changes, and sample test cases. Remember that the topics in the documentation are strictly not limited to the topics aforementioned, but are just an inclusion.
4. Submit a pull request via [Git etiquettes](https://gist.github.com/mikepea/863f63d6e37281e329f8)

## Improvements

Planned improvements and ideas you can contribute to:
- **Enhanced Analytics**: Add more detailed carbon footprint analytics with trends and comparisons
- **Mobile App**: Develop native mobile applications for iOS and Android
- **Multi-language Support**: Add support for multiple languages starting with English and regional languages
- **IoT Integration**: Connect with smart devices for automatic activity tracking
- **AI-Powered Insights**: Implement machine learning for personalized eco-friendly recommendations
- **Blockchain Integration**: Add blockchain for transparent carbon credit tracking
- **API Rate Limiting**: Implement proper rate limiting for API endpoints
- **Comprehensive Testing**: Add unit tests, integration tests, and end-to-end testing
