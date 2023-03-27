export const GET_SUBMISSION_DETAILS = `
query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    runtime
    runtimeDisplay
    runtimePercentile
    runtimeDistribution
    memory
    memoryDisplay
    memoryPercentile
    memoryDistribution
    code
    timestamp
    statusCode
    user {
      username
      profile {
        realName
        userAvatar
      }
    }
    lang {
      name
      verboseName
    }
    question {
      questionId
      acRate
      difficulty
      freqBar
      frontendQuestionId: questionFrontendId
      isFavor
      paidOnly: isPaidOnly
      content
      status
      title
      titleSlug
      topicTags {
        name
        id
        slug
      }
      hasSolution
      hasVideoSolution
    }
    notes
    topicTags {
      tagId
      slug
      name
    }
    runtimeError
    compileError
    lastTestcase
  }
}
`;
