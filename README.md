# Project Name: CSC667TeamJ-Uno
| Student Name |   Student Email   | GitHub Username |
|    :---:     |         :---:     |     :---:       |
|Chih Lin Chien|  cchien2@sfsu.edu |    brianjien    |  GitHub             |
Hsin Yu Chen | hchen31@sfsu.edu | shellychen1221 | 
Guillermo Alcantara | galcantaraventura@sfsu.edu | galcantara99 |



Intructions to run the project:
1. use ``npm install`` to install all the dependencies.
2. use migrations to create the database schema.
3. use ``node backend/server.js`` to start the server.
 

## Introduction
This project is a web application developed for the CSC667 course. It involves a backend server, a PostgreSQL database, and various dependencies managed via npm, support mutiplayer. The primary objective of this project is to create an engaging, real-time, two-player UNO game where users can join game rooms and compete against each other. This entails designing a system that supports real-time communication, ensuring that the game state is consistently synchronized between players. 

- The game should allow players to:
Join an existing game room or create a new one.


- Start a game automatically when two players are present and press ready button.


- Play the game in real-time with updates to the game state reflected immediately on both players' screens.
## Technologies Used and  Prerequisites
Frontend:HTML, CSS, JavaScript

Backend: Node.js with Express and Socket.io

Version Control: GitHub for collaboration

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (v6 or higher)

## Instructions to Run the Project

### Step 1: Clone the Repository
First, clone the repository to your local machine using Git.
1. ``git clone https://github.com/sfsu-csc-667-spring-2024-roberts/term-project-team-j-uno.git``
2. ``cd CSC667TeamJ-Uno\``

Step 2: Install Dependencies
Use npm install to install all the necessary dependencies.
``npm install``

Step 3: Set Up the Database
Ensure PostgreSQL is installed and running on your machine.

Create a .env file in the root directory of your project and add the following environment variables:

``DB_HOST=localhost``


``DB_USER=postgres``


``PASSWORD=abcd``


``DATABASE_NAME=CSC667TeamJ-Uno``


``PORT=5432``


``DATABASE_URL=postgres://postgres:abcd@localhost:5432/CSC667TeamJ-Uno``

Step 4: Create the Database Schema
Use migrations to create the database schema. 
We will use the pg-promise package to communicate with our database.
 
``npm install pg-promise``


``npm run db:migrate
``


The server should now be running and accessible at http://localhost:3001.
