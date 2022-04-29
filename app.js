import { MongoClient } from "mongodb";
import { config } from "dotenv";
import express, { json } from "express";

//Intializing express and mongo

const app = express();
app.use(json());
config();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

let createConnection = async () => {
  const client = new MongoClient(MONGO_URL);
  client
    .connect()
    .then((value) => {
      console.log("Connected to MongoClient");
    })
    .catch((error) => {
      console.log("Error connecting to MongoClient: " + error);
    });
  return client;
};

let client = await createConnection();

app.listen(PORT, async (err) => {
  if (!err) {
    console.log("Server listening on port " + PORT);
  } else {
    console.error("Failed to start server on port " + PORT);
  }
});

app.get("/", async (req, res) => {
  res.json({
    status: true,
    msg: "Hello world!",
  });
});

app.post("/createMentor", async (req, res) => {
  let mentorId = Number((Math.random() * 100).toFixed(0));
  let mentorName = req.body.mentorName;
  let topics = req.body.topics;
  let students = [];
  await client.db("aditya").collection("zen-mentors").insertOne({
    mentorId,
    mentorName,
    topics,
    students,
  });
  res.json({
    status: true,
    msg: "Mentor created successfully!",
    data: await client.db("aditya").collection("zen-mentors").findOne({
      mentorId,
    }),
  });
});

app.post("/createStudent", async (req, res) => {
  let studentId = Number((Math.random() * 100).toFixed(0));
  let studentName = req.body.studentName;
  let mentorId = null;
  await client.db("aditya").collection("zen-students").insertOne({
    studentId,
    studentName,
    mentorId,
  });
  res.json({
    status: true,
    msg: "Student created successfully!",
    data: await client.db("aditya").collection("zen-students").findOne({
      studentId,
    }),
  });
});

app.post("/assignToMentor", async (req, res) => {
  let studentId = req.body.studentId;
  let mentorId = req.body.mentorId;

  let student = await client.db("aditya").collection("zen-students").findOne({
    studentId: studentId,
  });

  let mentor = await client.db("aditya").collection("zen-mentors").findOne({
    mentorId: mentorId,
  });

  if (!student) {
    res.status(404).json({
      status: false,
      msg: "Student not found",
      data: student,
    });
  } else if (!mentor) {
    res.status(404).json({
      status: false,
      msg: "Mentor not found",
      data: mentor,
    });
  } else {
    student.mentorId = mentorId;
    mentor.students.push(student);
    await client
      .db("aditya")
      .collection("zen-students")
      .updateOne({ studentId }, { $set: student });

    await client
      .db("aditya")
      .collection("zen-mentors")
      .updateOne({ mentorId }, { $set: mentor });
    res.json({
      status: true,
      msg: "success",
      data: mentor,
    });
  }
});

app.post("/updateStudentsMentor", async (req, res) => {
  let studentId = req.body.studentId;
  let mentorId = req.body.mentorId;

  let student = await client.db("aditya").collection("zen-students").findOne({
    studentId: studentId,
  });

  let mentor = await client.db("aditya").collection("zen-mentors").findOne({
    mentorId: mentorId,
  });

  if (!student) {
    res.status(404).json({
      status: false,
      msg: "Student not found",
      data: student,
    });
  } else if (!mentor) {
    res.status(404).json({
      status: false,
      msg: "Mentor not found",
      data: mentor,
    });
  } else {
    //Removing student last mentor
    if (student.mentorId) {
      let oldMentor = await client
        .db("aditya")
        .collection("zen-mentors")
        .findOne({
          mentorId: student.mentorId,
        });
      let index = oldMentor.students
        .map((student) => student.mentorId)
        .indexOf(oldMentor.mentorId);
      if (index !== -1) {
        oldMentor.students.splice(index, 1);
      }

      await client
        .db("aditya")
        .collection("zen-mentors")
        .updateOne({ mentorId: oldMentor.mentorId }, { $set: oldMentor });
    }

    // Updating student's and mentor's record
    if (mentor.students.every((student) => student.mentorId != mentorId)) {
      student.mentorId = mentorId;
      mentor.students.push(student);
    }
    await client
      .db("aditya")
      .collection("zen-students")
      .updateOne({ studentId }, { $set: student });

    await client
      .db("aditya")
      .collection("zen-mentors")
      .updateOne({ mentorId }, { $set: mentor });

    res.json({
      status: true,
      msg: "success",
      data: mentor,
    });
  }
});

app.get("/getStudentsByMentorBy", async (req, res) => {
  let mentorId = req.query.mentorId;

  let mentor = await client
    .db("aditya")
    .collection("zen-mentors")
    .findOne({
      mentorId: Number(mentorId),
    });

  if (!mentor) {
    res.status(404).json({
      status: false,
      msg: "Mentor not found",
      data: mentor,
    });
  } else {
    res.json({
      status: true,
      msg: "Records Served!",
      data: mentor,
    });
  }
});
