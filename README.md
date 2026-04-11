# Group17MERN
This is the Project repo for Group 17's MERN stack Job Portal

                        A S C E N T

'ASCENT' is a job portal application that allows both applicants and users to sign up and interact with job listings in a variety of ways. 
Applicants: Can submit their resume and profile information to job's.
Employers: Can view applicant information. 
It's simple, user friendly, and makes managing job applications easier for both sides of the hiring process.

------------------------ FRONTEND ------------------------
- Frontend : React App using Typescript.
- In addition to defeault React files, our frontend is comprised of pages (/pages) and components (/components) that make up our easy to use, appealing UI/UX.
- Our frontend connects to our backend node server at localhost:5001 to access our API's and MongoDB database.

------------------------ BACKEND ------------------------
- Backend is based on a Node server.(server.js sets up our backend and connects to our mongo DB database)
- MONGO DB SCHEMAS: We have two schemas/templates to store entires into our database- Users and Jobs. Each contains necessary fields.
- Utilize email verification tokens (via Send Grid) when users attempt to sign up AND reset their password. Once verified, users can login to their account/reset their password.
- Uses JWT tokens for user authentication
- /routes contains all of the API endpoints used to access the database.


------------------------ AI Assistance Disclosure ------------------------
This project was developed with assistance from the following generative AI tools:

- TOOL: ChatGPT-5
- DATES: February 10 - April 13, 2026
- SCOPE: Helped learn React fundamentals alongside helping debug and format React login page.
- USE: Mainly debugging and explanation. Did not generate any full blocks of code, only helped diagnose issues with code, and was a valuable tool in learning html specifics and syntax.

- TOOL:Gemini 3.1
- DATES: February 10 - April 13, 2026
- SCOPE: Helped learn node.js fundamentals and debug node.js endpoints.
- USE: Mainly debugging and explanation. Did not generate any full blocks of code, only helped diagnose issues with code, and was a valuable tool in learning node.js specifics and syntax.

All AI-generated code was reviewed, tested, and modified to meet 
assignment requirements. Final implementation reflects my understanding 
of the concepts.
  

