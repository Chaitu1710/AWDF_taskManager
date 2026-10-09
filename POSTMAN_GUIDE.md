# Postman Testing Guide

Base URL:

http://localhost:5000

## 1. Check server

GET http://localhost:5000/

## 2. Create tasks

POST http://localhost:5000/tasks

Headers:
Content-Type: application/json

Body:
```json
{
  "title": "Task 1",
  "description": "Testing cache",
  "completed": false
}
```

Create 5-10 tasks if you want a larger dataset for testing.

## 3. Test cache

Send:

GET http://localhost:5000/tasks

First request = CACHE MISS.

Send it again.

Second request = CACHE HIT.

## 4. Test invalidation

POST a new task.

Then GET /tasks.

The first GET after POST should be a CACHE MISS and should contain the new task.

Repeat with PUT and DELETE.

## 5. Record response time

In Postman, record the Time value for 3 uncached and 3 cached requests.

Do not invent measurements.
