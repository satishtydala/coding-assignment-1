const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const addDays = require("date-fns/addDays");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertTodoTableToCamelCase = (responseObj) => {
  return {
    id: responseObj.id,
    todo: responseObj.todo,
    priority: responseObj.priority,
    status: responseObj.status,
    category: responseObj.category,
    dueDate: responseObj.due_date,
  };
};
const statusPropertyInTodo = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const priorityPropertyInTodo = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const priorityAndStatusInTodo = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const searchInTodo = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const categoryAndStatusInTodo = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const categoryInTodo = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const categoryAndPriorityInTodo = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//API 1
app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const {
    todo,
    category,
    priority,
    status,
    due_date,
    search_q = "",
  } = request.query;

  switch (true) {
    case statusPropertyInTodo(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM 
                    todo 
                WHERE 
                    todo LIKE "${search_q} AND
                    status = "${status}";`;
      break;
    case priorityPropertyInTodo(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE 
                    todo LIKE "${search_q}" AND
                    priority = "${priority}";`;
      break;
    case priorityAndStatusInTodo(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM 
                    todo
                WHERE 
                    todo LIKE "${search_q}" AND
                    priority = "${priority}" AND 
                    status = "${status}";`;
      break;
    case searchInTodo(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE 
                    todo LIKE "${search_q}";`;
      break;
    case categoryAndStatusInTodo(request.query):
      getTodoQuery = `
                SELECT 
                    *
                FROM 
                    todo 
                WHERE 
                    todo LIKE "${search_q}" AND
                    category = "${category}" AND 
                    status = "${status}";`;
      break;
    case categoryInTodo(request.query):
      getTodoQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE
                    todo LIKE "${search_q}" AND
                    category = "${category}";`;
      break;
    case categoryAndPriorityInTodo(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM 
                    todo
                WHERE 
                    todo LIKE "${search_q}" AND 
                    category = "${category}" AND 
                    priority = "${priority}";`;
      break;
    default:
      getTodoQuery = `
            SELECT 
                *
            FROM 
                todo 
            WHERE 
                todo LIKE "${search_q}";
            break;`;
  }
  const result = await db.all(getTodoQuery);
  response.send(result);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            *
        FROM 
            todo 
        WHERE 
            id = ${todoId};`;
  const result = await db.get(getTodoQuery);
  response.send(convertTodoTableToCamelCase(result));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const getTodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            new Date(2021,12,12);`;
  const result = await db.all(getTodoQuery);
  response.send(result);
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const createTodoQuery = `
        INSERT INTO
            todo
        VALUES (${id},
            "${todo}",
            "${priority}",
            "${status}",
            "${category}",
            "${dueDate}");`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            id = ${todoId};`;
  const result = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateQuery = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateQuery = "status";
      break;
    case requestBody.priority !== undefined:
      updateQuery = "priority";
      break;
    case requestBody.todo !== undefined:
      updateQuery = "todo";
      break;
    case requestBody.category !== undefined:
      updateQuery = "category";
      break;
    case requestBody.dueDate !== undefined:
      updateQuery = "dueDate";
      break;
  }

  const previousTodoQuery = `
        SELECT
            *
        FROM 
            todo
        WHERE 
            id = ${todoId};`;
  const getSelectedQuery = await db.get(previousTodoQuery);

  const {
    todo = getSelectedQuery.todo,
    status = getSelectedQuery.status,
    priority = getSelectedQuery.priority,
    category = getSelectedQuery.category,
    dueDate = getSelectedQuery.dueDate,
  } = request.body;

  const getUpdatedQuery = `
        UPDATE 
            todo 
        SET 
            todo = "${todo}",
            priority = "${priority}",
            status = "${status}",
            category = "${category}",
            dueDate = "${dueDate}"
        WHERE 
            id = ${todoId};`;
  await db.run(getUpdatedQuery);
  response.send(`${updateQuery} Updated`);
});

module.exports = app;
