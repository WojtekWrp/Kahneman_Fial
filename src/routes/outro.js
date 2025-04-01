const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const quizResults = req.session.quizResults || [];
  const totalQuestions = quizResults.length;
  const correctAnswers = quizResults.filter(result => result.result === 1).length;
  const successRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0; // Obliczenie procentu

  // Logowanie wyników do konsoli
  console.log("Quiz Results:", quizResults);
  console.log("Total Questions:", totalQuestions);
  console.log("Correct Answers:", correctAnswers);
  console.log("Success Rate:", successRate + "%");

  res.render('outro', { quizResults, successRate }); // Przekazanie wyników i procentu do widoku
});

module.exports = router;