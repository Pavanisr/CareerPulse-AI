export interface SeedDeck {
  title: string;
  category: string;
  targetRole: string;
  cards: { q: string; a: string }[];
}

export const SEED_DECKS: SeedDeck[] = [
  {
    title: 'AWS Cloud Practitioner Essentials',
    category: 'AWS',
    targetRole: 'Cloud Engineer',
    cards: [
      { q: 'What durability does Amazon S3 Standard provide?', a: '99.999999999% (11 nines) of object durability across multiple Availability Zones.' },
      { q: 'Security group vs network ACL?', a: 'Security groups are stateful, instance-level and allow-only. Network ACLs are stateless, subnet-level and support allow and deny rules.' },
      { q: 'What is an IAM role used for?', a: 'Granting temporary credentials to AWS services, applications or users, so no long-term access keys need to be stored.' },
      { q: 'RDS Multi-AZ vs Read Replica?', a: 'Multi-AZ is a synchronous standby for high availability and failover. Read replicas are asynchronous copies used to scale reads.' },
      { q: 'What is the maximum execution time of an AWS Lambda function?', a: '15 minutes.' },
      { q: 'Which AWS service provides a managed content delivery network?', a: 'Amazon CloudFront.' },
    ],
  },
  {
    title: 'NCLEX Core Concepts',
    category: 'NCLEX',
    targetRole: 'Registered Nurse',
    cards: [
      { q: 'Normal adult serum potassium range?', a: '3.5 to 5.0 mEq/L.' },
      { q: 'In prioritisation, what does ABC stand for?', a: 'Airway, Breathing, Circulation: address life-threatening problems in this order.' },
      { q: 'What is the antidote for heparin?', a: 'Protamine sulfate. (Warfarin is reversed with vitamin K.)' },
      { q: 'Early vs late sign of hypoxia?', a: 'Early: restlessness, anxiety, tachycardia. Late: cyanosis and bradycardia.' },
      { q: 'Normal adult resting heart rate?', a: '60 to 100 beats per minute.' },
    ],
  },
  {
    title: 'PMP Fundamentals',
    category: 'PMP',
    targetRole: 'Project Manager',
    cards: [
      { q: 'What is the critical path?', a: 'The longest sequence of dependent activities; it sets the minimum project duration and has zero total float.' },
      { q: 'Earned value formula and CPI?', a: 'EV = % complete x BAC. CPI = EV / AC. CPI below 1 means over budget.' },
      { q: 'Tuckman team development stages?', a: 'Forming, storming, norming, performing, adjourning.' },
      { q: 'PERT three-point estimate formula?', a: '(Optimistic + 4 x Most likely + Pessimistic) / 6.' },
      { q: 'What does a servant leader do for an agile team?', a: 'Removes impediments, coaches, and enables the team to self-organise rather than directing the work.' },
    ],
  },
  {
    title: 'Software Engineering Interview Core',
    category: 'Software Engineering',
    targetRole: 'Software Engineer',
    cards: [
      { q: 'Time complexity of binary search?', a: 'O(log n), on a sorted collection.' },
      { q: 'What does the D in SOLID stand for?', a: 'Dependency Inversion: depend on abstractions, not concrete implementations.' },
      { q: 'What does it mean for an HTTP method to be idempotent?', a: 'Repeating the same request leaves the server in the same state as making it once (e.g. PUT, DELETE, GET).' },
      { q: 'Process vs thread?', a: 'A process has its own memory space; threads within a process share memory, so they are lighter but need synchronisation.' },
      { q: 'State the CAP theorem.', a: 'During a network partition a distributed system must choose between consistency and availability.' },
      { q: 'What is a database index trade-off?', a: 'Faster reads on indexed columns at the cost of slower writes and extra storage.' },
    ],
  },
];
