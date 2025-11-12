// src/pages/Scores.jsx (or wherever you placed it)

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardBody, Typography } from "@material-tailwind/react";
import PageHeader from "@/widgets/layout/PageHeader";

function Scores() { // Changed from QuizScorePage to Scores
  const { quizSlug } = useParams(); // This hook extracts the dynamic part of the URL (e.g., "math-quiz")

  // Optional: Convert the slug back to a more readable name for display
  const readableQuizName = quizSlug 
    ? quizSlug.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
    : 'Unknown Quiz';

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 flex flex-col gap-10">
      <Card className="shadow-xl border-0 bg-white">
        <PageHeader
          title={`Scores for "${readableQuizName}"`}
          subtitle="Detailed quiz performance and student results"
          icon={(
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2z" />
            </svg>
          )}
        />
        <CardBody className="px-6 pt-0 pb-6">

          <Typography>
            This page will display the detailed scores for the quiz "{readableQuizName}".
          </Typography>
          {/*
            Here, you would typically fetch the actual score data
            from your backend using the `quizSlug` (e.g., `fetchScores(quizSlug)`)
            and then render it.
          */}
        </CardBody>
      </Card>
    </div>
  );
}

export default Scores; 