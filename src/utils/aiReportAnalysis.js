// AI Report Analysis Utility
// Automatically analyzes and categorizes user reports

// Report categories
export const REPORT_CATEGORIES = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  FAKE_PROFILE: 'fake_profile',
  SCAM: 'scam',
  VIOLENCE: 'violence',
  HATE_SPEECH: 'hate_speech',
  IMPERSONATION: 'impersonation',
  UNDERAGE: 'underage',
  OTHER: 'other'
};

// Severity levels
export const SEVERITY_LEVELS = {
  CRITICAL: { level: 5, label: 'Critical', color: 'error' },
  HIGH: { level: 4, label: 'High', color: 'warning' },
  MEDIUM: { level: 3, label: 'Medium', color: 'info' },
  LOW: { level: 2, label: 'Low', color: 'success' },
  MINIMAL: { level: 1, label: 'Minimal', color: 'secondary' }
};

// Action recommendations
export const RECOMMENDED_ACTIONS = {
  BAN_PERMANENT: 'ban_permanent',
  BAN_TEMPORARY: 'ban_temporary',
  WARN_USER: 'warn_user',
  REMOVE_CONTENT: 'remove_content',
  MONITOR: 'monitor',
  DISMISS: 'dismiss',
  INVESTIGATE: 'investigate'
};

// Keywords for categorization
const CATEGORY_KEYWORDS = {
  [REPORT_CATEGORIES.SPAM]: [
    'spam', 'bot', 'advertising', 'promotion', 'selling', 'buy', 
    'link', 'website', 'repeated', 'copy paste', 'same message'
  ],
  [REPORT_CATEGORIES.HARASSMENT]: [
    'harass', 'bully', 'threaten', 'stalk', 'abuse', 'insult',
    'attack', 'offensive', 'rude', 'mean', 'cruel'
  ],
  [REPORT_CATEGORIES.INAPPROPRIATE_CONTENT]: [
    'inappropriate', 'nsfw', 'nude', 'naked', 'sexual', 'porn',
    'explicit', 'graphic', 'disturbing', 'inappropriate image'
  ],
  [REPORT_CATEGORIES.FAKE_PROFILE]: [
    'fake', 'imposter', 'pretending', 'stolen photo', 'not real',
    'catfish', 'fake picture', 'fake name'
  ],
  [REPORT_CATEGORIES.SCAM]: [
    'scam', 'fraud', 'money', 'payment', 'bitcoin', 'investment',
    'gift card', 'wire transfer', 'suspicious link'
  ],
  [REPORT_CATEGORIES.VIOLENCE]: [
    'violence', 'violent', 'hurt', 'kill', 'death', 'weapon',
    'fight', 'attack', 'dangerous', 'threat'
  ],
  [REPORT_CATEGORIES.HATE_SPEECH]: [
    'racist', 'sexist', 'homophobic', 'hate', 'discrimination',
    'slur', 'offensive language', 'bigot'
  ],
  [REPORT_CATEGORIES.IMPERSONATION]: [
    'impersonat', 'pretending to be', 'fake account', 'stolen identity',
    'using my name', 'using my photo'
  ],
  [REPORT_CATEGORIES.UNDERAGE]: [
    'underage', 'minor', 'child', 'kid', 'young', 'age',
    'too young', 'not 18'
  ]
};

// Severity keywords
const SEVERITY_KEYWORDS = {
  CRITICAL: [
    'child', 'minor', 'underage', 'suicide', 'kill', 'death threat',
    'weapon', 'violence', 'illegal', 'crime'
  ],
  HIGH: [
    'threat', 'harass', 'stalk', 'scam', 'fraud', 'nude', 'sexual',
    'hate', 'racist', 'dangerous'
  ],
  MEDIUM: [
    'spam', 'fake', 'inappropriate', 'rude', 'offensive', 'bully'
  ],
  LOW: [
    'annoying', 'weird', 'suspicious', 'uncomfortable'
  ]
};

/**
 * Analyze report text and categorize it
 */
export const analyzeReport = (reportText, reportReason = '', evidence = null) => {
  const text = `${reportReason} ${reportText}`.toLowerCase();
  
  // Categorize report
  const category = categorizeReport(text);
  
  // Calculate severity
  const severity = calculateSeverity(text, category, evidence);
  
  // Suggest action
  const suggestedAction = suggestAction(category, severity, evidence);
  
  // Calculate confidence
  const confidence = calculateConfidence(text, category);
  
  // Detect patterns
  const patterns = detectPatterns(text);
  
  // Generate summary
  const summary = generateSummary(category, severity, patterns);
  
  return {
    category,
    severity,
    suggestedAction,
    confidence,
    patterns,
    summary,
    priority: calculatePriority(severity, patterns),
    autoResolvable: isAutoResolvable(category, severity, confidence),
    requiresImmediate: requiresImmediateAction(severity, patterns)
  };
};

/**
 * Categorize report based on keywords
 */
const categorizeReport = (text) => {
  const scores = {};
  
  // Calculate score for each category
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    scores[category] = keywords.reduce((score, keyword) => {
      return score + (text.includes(keyword) ? 1 : 0);
    }, 0);
  });
  
  // Find category with highest score
  const maxScore = Math.max(...Object.values(scores));
  
  if (maxScore === 0) {
    return REPORT_CATEGORIES.OTHER;
  }
  
  return Object.keys(scores).find(cat => scores[cat] === maxScore) || REPORT_CATEGORIES.OTHER;
};

/**
 * Calculate severity level
 */
const calculateSeverity = (text, category, evidence) => {
  let severityScore = 0;
  
  // Check for critical keywords
  if (SEVERITY_KEYWORDS.CRITICAL.some(kw => text.includes(kw))) {
    severityScore += 5;
  }
  
  // Check for high severity keywords
  if (SEVERITY_KEYWORDS.HIGH.some(kw => text.includes(kw))) {
    severityScore += 3;
  }
  
  // Check for medium severity keywords
  if (SEVERITY_KEYWORDS.MEDIUM.some(kw => text.includes(kw))) {
    severityScore += 2;
  }
  
  // Check for low severity keywords
  if (SEVERITY_KEYWORDS.LOW.some(kw => text.includes(kw))) {
    severityScore += 1;
  }
  
  // Adjust based on category
  if ([REPORT_CATEGORIES.VIOLENCE, REPORT_CATEGORIES.UNDERAGE].includes(category)) {
    severityScore += 2;
  }
  
  // Adjust based on evidence
  if (evidence && evidence.length > 0) {
    severityScore += 1;
  }
  
  // Map score to severity level
  if (severityScore >= 5) return SEVERITY_LEVELS.CRITICAL;
  if (severityScore >= 4) return SEVERITY_LEVELS.HIGH;
  if (severityScore >= 2) return SEVERITY_LEVELS.MEDIUM;
  if (severityScore >= 1) return SEVERITY_LEVELS.LOW;
  return SEVERITY_LEVELS.MINIMAL;
};

/**
 * Suggest action based on analysis
 */
const suggestAction = (category, severity, evidence) => {
  // Critical cases
  if (severity.level >= 5) {
    return {
      action: RECOMMENDED_ACTIONS.BAN_PERMANENT,
      reason: 'Critical violation detected',
      duration: 'permanent'
    };
  }
  
  // High severity
  if (severity.level >= 4) {
    if (category === REPORT_CATEGORIES.VIOLENCE || category === REPORT_CATEGORIES.HATE_SPEECH) {
      return {
        action: RECOMMENDED_ACTIONS.BAN_TEMPORARY,
        reason: 'Serious violation',
        duration: '30 days'
      };
    }
    return {
      action: RECOMMENDED_ACTIONS.BAN_TEMPORARY,
      reason: 'High severity violation',
      duration: '7 days'
    };
  }
  
  // Medium severity
  if (severity.level >= 3) {
    if (evidence) {
      return {
        action: RECOMMENDED_ACTIONS.WARN_USER,
        reason: 'Violation with evidence',
        duration: 'warning'
      };
    }
    return {
      action: RECOMMENDED_ACTIONS.INVESTIGATE,
      reason: 'Requires investigation',
      duration: null
    };
  }
  
  // Low severity
  if (severity.level >= 2) {
    if (category === REPORT_CATEGORIES.SPAM) {
      return {
        action: RECOMMENDED_ACTIONS.WARN_USER,
        reason: 'Spam detected',
        duration: 'warning'
      };
    }
    return {
      action: RECOMMENDED_ACTIONS.MONITOR,
      reason: 'Monitor user activity',
      duration: null
    };
  }
  
  // Minimal severity
  return {
    action: RECOMMENDED_ACTIONS.DISMISS,
    reason: 'Low priority, likely false report',
    duration: null
  };
};

/**
 * Calculate confidence in analysis
 */
const calculateConfidence = (text, category) => {
  const keywords = CATEGORY_KEYWORDS[category] || [];
  const matches = keywords.filter(kw => text.includes(kw)).length;
  
  if (matches >= 3) return 0.9;
  if (matches >= 2) return 0.75;
  if (matches >= 1) return 0.6;
  return 0.4;
};

/**
 * Detect patterns in report
 */
const detectPatterns = (text) => {
  const patterns = [];
  
  // Repeated words (spam indicator)
  const words = text.split(' ');
  const wordCounts = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  const repeatedWords = Object.entries(wordCounts)
    .filter(([_, count]) => count >= 3)
    .map(([word]) => word);
  
  if (repeatedWords.length > 0) {
    patterns.push({
      type: 'repeated_content',
      description: 'Repeated words detected (possible spam)',
      confidence: 0.7
    });
  }
  
  // URLs detected
  if (text.match(/https?:\/\//)) {
    patterns.push({
      type: 'contains_url',
      description: 'Contains URL (possible spam/scam)',
      confidence: 0.6
    });
  }
  
  // All caps (aggressive behavior)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 20) {
    patterns.push({
      type: 'excessive_caps',
      description: 'Excessive capital letters (aggressive)',
      confidence: 0.5
    });
  }
  
  // Multiple exclamation marks
  if ((text.match(/!/g) || []).length >= 3) {
    patterns.push({
      type: 'excessive_punctuation',
      description: 'Excessive punctuation',
      confidence: 0.4
    });
  }
  
  return patterns;
};

/**
 * Generate human-readable summary
 */
const generateSummary = (category, severity, patterns) => {
  const categoryLabels = {
    [REPORT_CATEGORIES.SPAM]: 'Spam/Advertising',
    [REPORT_CATEGORIES.HARASSMENT]: 'Harassment/Bullying',
    [REPORT_CATEGORIES.INAPPROPRIATE_CONTENT]: 'Inappropriate Content',
    [REPORT_CATEGORIES.FAKE_PROFILE]: 'Fake Profile',
    [REPORT_CATEGORIES.SCAM]: 'Scam/Fraud',
    [REPORT_CATEGORIES.VIOLENCE]: 'Violence/Threats',
    [REPORT_CATEGORIES.HATE_SPEECH]: 'Hate Speech',
    [REPORT_CATEGORIES.IMPERSONATION]: 'Impersonation',
    [REPORT_CATEGORIES.UNDERAGE]: 'Underage User',
    [REPORT_CATEGORIES.OTHER]: 'Other Violation'
  };
  
  let summary = `${categoryLabels[category]} - ${severity.label} Priority`;
  
  if (patterns.length > 0) {
    summary += ` (${patterns.length} pattern${patterns.length > 1 ? 's' : ''} detected)`;
  }
  
  return summary;
};

/**
 * Calculate priority score for sorting
 */
const calculatePriority = (severity, patterns) => {
  let priority = severity.level * 10;
  priority += patterns.length * 2;
  return Math.min(priority, 100);
};

/**
 * Check if report can be auto-resolved
 */
const isAutoResolvable = (category, severity, confidence) => {
  // Only auto-resolve low severity with high confidence
  if (severity.level <= 2 && confidence >= 0.8) {
    return category === REPORT_CATEGORIES.SPAM;
  }
  return false;
};

/**
 * Check if requires immediate action
 */
const requiresImmediateAction = (severity, patterns) => {
  if (severity.level >= 5) return true;
  
  const criticalPatterns = patterns.filter(p => 
    ['violence', 'threat', 'underage'].some(kw => p.type.includes(kw))
  );
  
  return criticalPatterns.length > 0;
};

/**
 * Batch analyze multiple reports
 */
export const batchAnalyzeReports = (reports) => {
  return reports.map(report => ({
    ...report,
    aiAnalysis: analyzeReport(
      report.description || '',
      report.reason || '',
      report.evidence
    )
  })).sort((a, b) => b.aiAnalysis.priority - a.aiAnalysis.priority);
};

/**
 * Get statistics from analyzed reports
 */
export const getReportStatistics = (analyzedReports) => {
  const stats = {
    total: analyzedReports.length,
    byCategory: {},
    bySeverity: {},
    requiresImmediate: 0,
    autoResolvable: 0,
    avgConfidence: 0
  };
  
  analyzedReports.forEach(report => {
    const analysis = report.aiAnalysis;
    
    // Count by category
    stats.byCategory[analysis.category] = (stats.byCategory[analysis.category] || 0) + 1;
    
    // Count by severity
    stats.bySeverity[analysis.severity.label] = (stats.bySeverity[analysis.severity.label] || 0) + 1;
    
    // Count special cases
    if (analysis.requiresImmediate) stats.requiresImmediate++;
    if (analysis.autoResolvable) stats.autoResolvable++;
    
    // Sum confidence
    stats.avgConfidence += analysis.confidence;
  });
  
  // Calculate average confidence
  stats.avgConfidence = stats.total > 0 ? stats.avgConfidence / stats.total : 0;
  
  return stats;
};

export default {
  analyzeReport,
  batchAnalyzeReports,
  getReportStatistics,
  REPORT_CATEGORIES,
  SEVERITY_LEVELS,
  RECOMMENDED_ACTIONS
};
