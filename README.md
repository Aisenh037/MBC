# MBC Connect

**Your Central Hub for the MBC Community.**

---

## About The Project

MBC Connect is the official digital platform for the MBC Department, designed to foster communication, collaboration, and community. This portal serves as a central hub, providing students, faculty, and staff with easy access to academic information, departmental news, and essential management tools.

Our goal is to create a more connected and efficient environment by simplifying access to resources and streamlining daily operations.

## Tech Stack

This project uses a microservices architecture:

* **Core Application (MERN Stack):**
    * **Frontend:** **React**
    * **Backend:** **Node.js** & **Express.js**
    * **Database:** **MongoDB**
* **AI & Analytics Service:**
    * **Framework:** **Python** & **FastAPI**

## Getting Started

This project is divided into three main parts: the `client` (frontend), the `app-server` (main backend), and the `ai-service`.

### Prerequisites

* Git
* Node.js v18+
* Python 3.10+
* MongoDB

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/mbc-connect.git](https://github.com/your-username/mbc-connect.git)
    cd mbc-connect
    ```

2.  **Client (React Frontend) Setup:**
    ```sh
    cd client
    npm install
    cp .env.example .env      # Configure API endpoints
    npm run dev
    ```

3.  **App Server (Node.js/Express Backend) Setup:**
    ```sh
    cd ../app-server
    npm install
    cp .env.example .env      # Configure MongoDB connection string, ports, etc.
    npm run dev               # Or your configured start script
    ```

4.  **AI Service (Python/FastAPI) Setup:**
    ```sh
    cd ../ai-service
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    pip install -r requirements.txt
    cp .env.example .env      # Configure any necessary environment variables
    uvicorn main:app --reload
    ```
