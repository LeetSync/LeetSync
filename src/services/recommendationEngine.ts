import {
  ProblemRecord,
  SimilarProblemRecommendation,
  TopicPerformance,
} from '../types/Revision';
import { DSAPatternDetector } from './dsaPatternDetector';

export class RecommendationEngine {
  /**
   * Recommends previously solved problems similar to a target problem based on
   * verified DSA tags, topic weaknesses, and revision history.
   * Never recommends fabricated problems or external unverified questions.
   */
  static getSimilarProblems(
    targetProblem: ProblemRecord,
    allProblems: Record<string, ProblemRecord> | ProblemRecord[],
    topicPerformances: TopicPerformance[] = []
  ): SimilarProblemRecommendation[] {
    const problemsList: ProblemRecord[] = Array.isArray(allProblems)
      ? allProblems
      : Object.values(allProblems);

    if (!targetProblem || !targetProblem.slug) {
      return [];
    }

    const targetTags = new Set(targetProblem.topicTags || []);
    const weaknessMap = DSAPatternDetector.getTopicWeaknessMap(topicPerformances);

    const recommendations: SimilarProblemRecommendation[] = [];

    for (const candidate of problemsList) {
      // Avoid recommending the exact same problem
      if (candidate.slug === targetProblem.slug) continue;

      const candidateTags = candidate.topicTags || [];
      if (candidateTags.length === 0 || targetTags.size === 0) {
        // Cannot establish similarity without verified tags
        continue;
      }

      const sharedTags = candidateTags.filter((t) => targetTags.has(t));
      if (sharedTags.length === 0) continue;

      // Jaccard similarity across verified tags
      const unionTags = new Set([...Array.from(targetTags), ...candidateTags]);
      const jaccardRatio = sharedTags.length / unionTags.size;

      // Topic weakness boost
      let isWeakTopicReinforcement = false;
      let highestWeaknessScore = 0;
      for (const tag of sharedTags) {
        const weakness = weaknessMap[tag] ?? 0;
        if (weakness >= 0.7) {
          isWeakTopicReinforcement = true;
          highestWeaknessScore = Math.max(highestWeaknessScore, weakness);
        }
      }

      // Revision history urgency
      const isDueForRevision =
        candidate.lastRevisionOutcome === 'failed' ||
        candidate.lastRevisionOutcome === 'hints' ||
        candidate.failedAttemptsCount > 0;

      // Similarity score (0 - 100)
      let score = jaccardRatio * 60;
      if (isWeakTopicReinforcement) score += 25 * highestWeaknessScore;
      if (isDueForRevision) score += 15;
      score = Math.min(100, Math.round(score));

      // Category and detailed explanation
      let relevanceTag: SimilarProblemRecommendation['relevanceTag'] = 'Shared Core Pattern';
      let reason = '';

      if (isWeakTopicReinforcement) {
        relevanceTag = 'Weak Topic Reinforcement';
        reason = `Shares verified tag(s) [${sharedTags.join(', ')}] with ${targetProblem.title}, addressing an identified weak area.`;
      } else if (isDueForRevision) {
        relevanceTag = 'Due for Revision';
        reason = `Shares concept [${sharedTags.join(', ')}] and was previously solved with difficulties or assistance.`;
      } else {
        relevanceTag = 'Shared Core Pattern';
        reason = `Shares verified concept [${sharedTags.join(', ')}] with ${targetProblem.title} for pattern reinforcement.`;
      }

      recommendations.push({
        problem: candidate,
        targetProblemSlug: targetProblem.slug,
        sharedTags,
        similarityScore: score,
        reason,
        relevanceTag,
      });
    }

    // Sort descending by similarity score
    return recommendations.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Generates general weak-topic reinforcement recommendations from previously solved problems.
   */
  static getWeakTopicRecommendations(
    allProblems: Record<string, ProblemRecord> | ProblemRecord[],
    topicPerformances: TopicPerformance[],
    limit = 5
  ): SimilarProblemRecommendation[] {
    const problemsList: ProblemRecord[] = Array.isArray(allProblems)
      ? allProblems
      : Object.values(allProblems);

    const weakTopics = topicPerformances
      .filter((t) => t.classification === 'Weakness')
      .map((t) => t.topic);

    if (weakTopics.length === 0) return [];

    const recommendations: SimilarProblemRecommendation[] = [];

    for (const problem of problemsList) {
      const tags = problem.topicTags || [];
      const sharedWeakTags = tags.filter((t) => weakTopics.includes(t));

      if (sharedWeakTags.length > 0) {
        const daysSince = Math.floor(
          (Date.now() - (problem.lastRevisionTimestamp || problem.lastSolvedTimestamp || 0)) /
            (1000 * 60 * 60 * 24)
        );

        let score = 50 + sharedWeakTags.length * 15;
        if (problem.lastRevisionOutcome === 'failed') score += 20;
        else if (problem.lastRevisionOutcome === 'hints') score += 10;
        score = Math.min(100, score);

        recommendations.push({
          problem,
          targetProblemSlug: '',
          sharedTags: sharedWeakTags,
          similarityScore: score,
          reason: `Addresses weak topic [${sharedWeakTags.join(', ')}]. ${
            daysSince > 0 ? `Last revised ${daysSince} days ago.` : 'Recently solved.'
          }`,
          relevanceTag: 'Weak Topic Reinforcement',
        });
      }
    }

    return recommendations.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
  }
}
