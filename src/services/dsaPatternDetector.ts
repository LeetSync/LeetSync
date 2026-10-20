import {
  ProblemRecord,
  RevisionLogEntry,
  TopicClassification,
  TopicPerformance,
} from '../types/Revision';

export class DSAPatternDetector {
  /**
   * Analyzes topic-level performance based strictly on verified tags,
   * observed attempts, and recorded revision outcomes.
   * Never infers weaknesses or strengths from difficulty or titles alone.
   */
  static analyzeTopics(
    problems: Record<string, ProblemRecord> | ProblemRecord[],
    revisions: RevisionLogEntry[] = []
  ): TopicPerformance[] {
    const problemsList: ProblemRecord[] = Array.isArray(problems)
      ? problems
      : Object.values(problems);

    // Group data by verified topic tags
    const topicMap: Record<
      string,
      {
        problems: ProblemRecord[];
        revisions: RevisionLogEntry[];
      }
    > = {};

    for (const problem of problemsList) {
      const tags = (problem.topicTags && problem.topicTags.length > 0)
        ? problem.topicTags
        : [];

      for (const tag of tags) {
        if (!tag || typeof tag !== 'string') continue;
        const normalizedTag = tag.trim();
        if (!normalizedTag) continue;

        if (!topicMap[normalizedTag]) {
          topicMap[normalizedTag] = { problems: [], revisions: [] };
        }
        topicMap[normalizedTag].problems.push(problem);
      }
    }

    // Associate revisions with topics via verified tags
    for (const rev of revisions) {
      const tags = rev.topicTags && rev.topicTags.length > 0
        ? rev.topicTags
        : (rev.problemSlug && !Array.isArray(problems) && problems[rev.problemSlug]?.topicTags)
        ? (problems as Record<string, ProblemRecord>)[rev.problemSlug].topicTags
        : [];

      for (const tag of tags) {
        if (!tag || typeof tag !== 'string') continue;
        const normalizedTag = tag.trim();
        if (!normalizedTag) continue;

        if (!topicMap[normalizedTag]) {
          topicMap[normalizedTag] = { problems: [], revisions: [] };
        }
        topicMap[normalizedTag].revisions.push(rev);
      }
    }

    const results: TopicPerformance[] = [];

    for (const [topic, data] of Object.entries(topicMap)) {
      const problemsSolved = data.problems.length;
      let totalAttempts = 0;
      let failedAttempts = 0;

      for (const p of data.problems) {
        totalAttempts += p.attemptsCount || 1;
        failedAttempts += p.failedAttemptsCount || 0;
      }

      const totalRevisions = data.revisions.length;
      let revisionsIndependent = 0;
      let revisionsHints = 0;
      let revisionsFailed = 0;

      for (const r of data.revisions) {
        if (r.outcome === 'independent') revisionsIndependent++;
        else if (r.outcome === 'hints') revisionsHints++;
        else if (r.outcome === 'failed') revisionsFailed++;
      }

      const attemptSuccessRate =
        totalAttempts > 0
          ? Number((((totalAttempts - failedAttempts) / totalAttempts) * 100).toFixed(1))
          : null;

      const revisionSuccessRate =
        totalRevisions > 0
          ? Number(
              (
                ((revisionsIndependent + 0.4 * revisionsHints) / totalRevisions) *
                100
              ).toFixed(1)
            )
          : null;

      // Evidence details collection
      const evidenceDetails: string[] = [];
      evidenceDetails.push(`${problemsSolved} verified problem${problemsSolved === 1 ? '' : 's'} solved.`);

      if (totalAttempts > 0) {
        evidenceDetails.push(
          `${totalAttempts} submission attempt${totalAttempts === 1 ? '' : 's'} observed (${failedAttempts} failed attempt${failedAttempts === 1 ? '' : 's'}).`
        );
      } else {
        evidenceDetails.push('No granular submission attempts logged.');
      }

      if (totalRevisions > 0) {
        evidenceDetails.push(
          `${totalRevisions} revision${totalRevisions === 1 ? '' : 's'} completed: ${revisionsIndependent} independent, ${revisionsHints} with hints, ${revisionsFailed} failed.`
        );
      } else {
        evidenceDetails.push('No revisions recorded yet for this topic.');
      }

      // Check evidence sufficiency
      // Rule: Never infer weakness from 1 single solve without negative evidence
      const hasDirectEvidence =
        totalRevisions >= 1 ||
        failedAttempts >= 1 ||
        problemsSolved >= 2;

      let classification: TopicClassification = 'Insufficient data';
      let masteryScore: number | null = null;
      let evidenceSummary = '';

      if (!hasDirectEvidence) {
        classification = 'Insufficient data';
        evidenceSummary = `Only 1 problem solved with no recorded revisions or failed attempts. Insufficient data to evaluate ${topic}.`;
      } else {
        // Calculate mastery score
        if (totalRevisions > 0 && totalAttempts > 0) {
          const revComponent = (revisionsIndependent * 100 + revisionsHints * 40) / totalRevisions;
          const attComponent = Math.max(0, (totalAttempts - failedAttempts) / totalAttempts) * 100;
          masteryScore = Number((0.65 * revComponent + 0.35 * attComponent).toFixed(1));
        } else if (totalRevisions > 0) {
          masteryScore = Number(
            (((revisionsIndependent * 100 + revisionsHints * 40) / totalRevisions)).toFixed(1)
          );
        } else if (totalAttempts > 0) {
          masteryScore = Number(
            (Math.max(0, (totalAttempts - failedAttempts) / totalAttempts) * 100).toFixed(1)
          );
        }

        // Classification based on verified evidence
        const hasHighFailures = failedAttempts >= 2;
        const hasFailedRevisions = revisionsFailed >= 1;
        const hintRate = totalRevisions > 0 ? (revisionsHints + revisionsFailed) / totalRevisions : 0;

        if (
          (masteryScore !== null && masteryScore < 50) ||
          hasFailedRevisions ||
          (totalRevisions >= 2 && hintRate >= 0.5) ||
          (hasHighFailures && (revisionsHints > 0 || totalRevisions === 0))
        ) {
          classification = 'Weakness';
          evidenceSummary = `Identified as a Weakness: ${
            revisionsFailed > 0
              ? `${revisionsFailed} revision(s) could not be solved`
              : revisionsHints > 0
              ? `${revisionsHints} revision(s) required hints (${(hintRate * 100).toFixed(0)}% assistance rate)`
              : `${failedAttempts} failed submission attempts observed`
          }.`;
        } else if (
          masteryScore !== null &&
          masteryScore >= 75 &&
          (revisionsIndependent >= 1 || problemsSolved >= 3) &&
          failedAttempts === 0
        ) {
          classification = 'Strength';
          evidenceSummary = `Identified as a Strength: high mastery (${masteryScore}%), ${
            revisionsIndependent > 0 ? `${revisionsIndependent} clean independent revision(s)` : `${problemsSolved} clean solves`
          } and 0 failed attempts.`;
        } else {
          classification = 'Developing';
          evidenceSummary = `Topic in progress (${masteryScore !== null ? `${masteryScore}% mastery` : 'building history'}). Regular revision recommended to solidify proficiency.`;
        }
      }

      results.push({
        topic,
        problemsSolved,
        totalAttempts,
        failedAttempts,
        attemptSuccessRate,
        totalRevisions,
        revisionsIndependent,
        revisionsHints,
        revisionsFailed,
        revisionSuccessRate,
        masteryScore,
        classification,
        evidenceSummary,
        evidenceDetails,
      });
    }

    // Sort: Weaknesses first, then by lowest mastery score, then by problems solved descending
    return results.sort((a, b) => {
      const order: Record<TopicClassification, number> = {
        Weakness: 0,
        Developing: 1,
        'Insufficient data': 2,
        Strength: 3,
      };
      if (order[a.classification] !== order[b.classification]) {
        return order[a.classification] - order[b.classification];
      }
      if (a.masteryScore !== null && b.masteryScore !== null) {
        return a.masteryScore - b.masteryScore;
      }
      return b.problemsSolved - a.problemsSolved;
    });
  }

  /**
   * Helper to quickly get topic weaknesses map for scoring
   */
  static getTopicWeaknessMap(topicPerformances: TopicPerformance[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const tp of topicPerformances) {
      if (tp.classification === 'Weakness') {
        // High weakness factor (0.8 - 1.0)
        const score = tp.masteryScore !== null ? Math.max(0.7, 1 - tp.masteryScore / 100) : 0.85;
        map[tp.topic] = score;
      } else if (tp.classification === 'Developing') {
        const score = tp.masteryScore !== null ? 1 - tp.masteryScore / 100 : 0.5;
        map[tp.topic] = Math.min(0.65, Math.max(0.35, score));
      } else if (tp.classification === 'Strength') {
        map[tp.topic] = 0.15; // Low priority bonus for strong topics
      } else {
        map[tp.topic] = 0.45; // Neutral for insufficient data
      }
    }
    return map;
  }
}
