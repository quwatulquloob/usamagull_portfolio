/**
 * Default catalog content seeded into a fresh D1 database so the public
 * site renders complete sections out of the box. `INSERT OR IGNORE`
 * keeps this idempotent and never overwrites admin edits.
 */
export interface SeedService {
  id: string;
  title: string;
  category: string;
  description: string;
  deliverables: string[];
  tags: string[];
  price: number;
  price_suffix: string;
}

export interface SeedLogo {
  id: string;
  name: string;
  image_url: string;
}

export const SEED_SERVICES: SeedService[] = [
  {
    id: 'agentic-ai',
    title: 'Agentic AI & LLM Systems',
    category: 'Autonomous Intelligence',
    description:
      'Custom AI chatbots and multi-agent workflows engineered with LangGraph, advanced RAG architectures, and custom tool calling for real business workflows.',
    deliverables: [
      'Multi-agent orchestration with LangGraph & CrewAI',
      'Enterprise RAG pipelines with vector databases',
      'Autonomous tool calling & API integrations',
      'Custom prompt engineering & guardrails',
    ],
    tags: ['LangGraph', 'Python', 'OpenAI / Claude', 'Vector DBs'],
    price: 0,
    price_suffix: '',
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision & Real-Time AI',
    category: 'Visual Perception',
    description:
      'Object detection, instance segmentation, and video analytics pipelines using YOLOv8/YOLOv11 and OpenCV, optimized for edge devices and cloud streams.',
    deliverables: [
      'Custom object detection trained on domain datasets',
      'Low-latency video streaming pipelines (RTSP, WebRTC)',
      'Edge optimization for NVIDIA Jetson & TensorRT',
      'Automated QA inspection & anomaly detection',
    ],
    tags: ['YOLOv8/11', 'OpenCV', 'TensorRT', 'PyTorch'],
    price: 0,
    price_suffix: '',
  },
  {
    id: 'voice-ai',
    title: 'Voice AI Assistants',
    category: 'Conversational Audio',
    description:
      'End-to-end conversational voice agents featuring ultra-fast Speech-to-Text (STT), context-aware LLM reasoning, natural Text-to-Speech (TTS), and full telephony integration.',
    deliverables: [
      'Sub-800ms end-to-end voice latency for natural dialogue',
      'Telephony routing & setup (Twilio, SIP trunking)',
      'Neural TTS & voice cloning (ElevenLabs, Cartesia)',
      'Automated call transcripts & CRM synchronization',
    ],
    tags: ['Twilio / SIP', 'Whisper STT', 'ElevenLabs', 'WebSockets'],
    price: 0,
    price_suffix: '',
  },
  {
    id: 'ml-ai-systems',
    title: 'Machine Learning and AI Systems Development',
    category: 'Core AI Development',
    description:
      'End-to-end machine learning and AI systems development, from data preprocessing and model training to deployment and monitoring. Specializing in custom ML solutions tailored to your specific business needs.',
    deliverables: [
      'Custom ML model development and training',
      'Data preprocessing and feature engineering',
      'Model evaluation and performance optimization',
      'Automated deployment and monitoring systems',
    ],
    tags: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'MLflow'],
    price: 0,
    price_suffix: '',
  },
];

export interface SeedProject {
  id: string;
  title: string;
  category: string;
  description: string;
  full_details: string;
  client: string;
  stack: string;
  impact: string;
  duration: string;
  gradient: string;
}

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: 'proj-1',
    title: 'Enterprise RAG Pipeline',
    category: 'agentic',
    description:
      'Built a retrieval-augmented generation system for internal knowledge management, reducing search time by 60%.',
    full_details:
      "Designed and deployed an enterprise RAG pipeline integrating vector databases, semantic search, and GPT-4 for a Fortune 500 company's internal knowledge base. The system indexes over 200K documents and serves contextual answers with source citations in under 2 seconds.",
    client: 'Fortune 500 Enterprise',
    stack: 'Python, LangChain, Pinecone, FastAPI, AWS',
    impact: '60% reduction in search time, 4x faster onboarding',
    duration: '3 months',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 40%, #ffad33 100%)',
  },
  {
    id: 'proj-2',
    title: 'Multi-Agent Orchestration Framework',
    category: 'agentic',
    description:
      'Designed an autonomous multi-agent system that orchestrates complex business workflows with zero human intervention.',
    full_details:
      'Architected a multi-agent orchestration framework where specialized AI agents collaborate to handle end-to-end business processes — from data extraction and validation to report generation and stakeholder notification.',
    client: 'FinTech Startup',
    stack: 'Python, AutoGen, CrewAI, Redis, Docker',
    impact: '90% automation of manual review workflows',
    duration: '4 months',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
  },
  {
    id: 'proj-3',
    title: 'Real-Time Object Detection System',
    category: 'vision',
    description:
      'Deployed a 60fps edge-optimized detection system for manufacturing quality assurance on embedded hardware.',
    full_details:
      'Engineered a real-time object detection pipeline running at 60fps on NVIDIA Jetson edge devices for a manufacturing plant. Identifies defects on assembly lines with 98.5% accuracy, triggering automated rejection and alerting.',
    client: 'VisionTech Manufacturing',
    stack: 'Python, YOLOv8, TensorRT, NVIDIA Jetson, MQTT',
    impact: '98.5% accuracy, 70% fewer defects reaching customers',
    duration: '4 months',
    gradient: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 50%, #023e8a 100%)',
  },
  {
    id: 'proj-5',
    title: 'Predictive Analytics Engine',
    category: 'platforms',
    description:
      'End-to-end ML platform for demand forecasting, reducing inventory costs by 25% for an e-commerce client.',
    full_details:
      'Built a comprehensive demand forecasting platform that ingests sales data, market signals, and seasonal patterns to predict product demand 90 days ahead with automated retraining and A/B evaluation.',
    client: 'E-commerce Platform',
    stack: 'Python, XGBoost, Prophet, Airflow, Snowflake, Streamlit',
    impact: '25% inventory cost reduction, 92% forecast accuracy',
    duration: '4 months',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
  },
  {
    id: 'proj-6',
    title: 'Real-Time Fraud Detection',
    category: 'platforms',
    description:
      'Transaction scoring system processing 10K+ events/second with sub-100ms latency for a payments company.',
    full_details:
      'Built a real-time fraud detection system that scores every transaction in under 100ms using an ensemble of gradient-boosted models and neural networks. Reduced fraud losses by 60% while maintaining low false positives.',
    client: 'Payments Company (NDA)',
    stack: 'Python, XGBoost, Kafka Streams, Flink, Cassandra, AWS',
    impact: '60% fraud reduction, 10K+ TPS at sub-100ms latency',
    duration: '4 months',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)',
  },
];

export interface SeedAward {
  id: string;
  title: string;
  year: string;
  issuer: string;
  status_pill: string;
  description: string;
  why_it_matters: string;
  tags: string[];
}

export const SEED_AWARDS: SeedAward[] = [
  {
    id: 'cybhi-2025',
    title: 'Led CYBHIAI Platform 2025',
    year: '2025',
    issuer: 'California Government Public-Sector Initiative',
    status_pill: 'Public Sector Impact',
    description:
      'California government-funded agentic AI system for school incident reporting, threat mitigation, and automated triage. Recognized for delivering an enterprise-grade LLM solution for public-sector use.',
    why_it_matters:
      'Demonstrates the rare capability to deliver compliant, high-stakes, enterprise-grade LLM architectures trusted by public institutions.',
    tags: ['Agentic AI', 'Government Funded', 'Public Safety', 'Enterprise LLMs'],
  },
  {
    id: 'certifications-ai',
    title: 'Certifications in Applied AI & Modern Frameworks',
    year: '2023 – Present',
    issuer: 'DeepLearning.AI & Industry Academies',
    status_pill: 'Continuous Upskilling',
    description:
      'Completed rigorous specialized certifications from DeepLearning.AI and leading engineering curriculums covering PyTorch deep learning, advanced RAG architectures, LangChain / LangGraph development, and Agent & MCP development.',
    why_it_matters:
      'Reflects continuous upskilling in modern AI, ensuring every solution built leverages cutting-edge paradigms.',
    tags: ['DeepLearning.AI', 'PyTorch', 'LangChain & RAG', 'Agent & MCP'],
  },
  {
    id: 'guest-speaker',
    title: 'Guest Speaker: AI Engineering as a Career',
    year: '2024 – 2025',
    issuer: 'University Engineering Department',
    status_pill: 'Community Leadership',
    description:
      'Invited as an industry guest speaker to lead a university technical seminar for undergraduate engineering students, helping students understand real-world ML and LLM work versus academic research.',
    why_it_matters:
      'Highlights industry credibility, recognized thought leadership, and strong communication skills.',
    tags: ['Guest Speaker', 'Mentorship', 'AI Engineering Talk', 'Knowledge Sharing'],
  },
];

export const SEED_LOGOS: SeedLogo[] = [
  {
    id: 'python',
    name: 'Python',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48cGF0aCBkPSJNMTE5LjMgNzMuOGMtOC4zIDAtMTUuNSA1LjktMTUuNSAxMy44IDAgNy43IDcuMiAxMy44IDE1LjUgMTMuOHMxNS41LTYuMSAxNS41LTEzLjhjMC03LjktNy4yLTEzLjgtMTUuNS0xMy44em0tNS4zIDI4LjdjLTE2LjMgMC0yOS43IDEzLjMtMjkuNyAyOS44IDAgNi43IDIuMiAxMy4xIDUuOSAxOC4ybC0yNC4zIDE0LjhDMzAuOSAxNTUuNSA4IDEzMS42IDggMTAzLjhjMC0zNS42IDE2LjMtNjcuNyA0NC44LTg4LjFsMjQuNCAxNC4xYy0xMS44IDIwLjEtMzMuNiAzMy41LTU4LjYgMzMuNS0yOC44IDAtNTIuMy0yMy41LTUyLjMtNTIuMyAwLTI4LjcgMjMuNS01Mi4zIDUyLjMtNTIuMyA0NS4yIDAgODAuNSAzMy44IDg2LjIgNzguN2wtNDAuNy0yMy41Yy0yLjgtMzIuNS0yMC44LTU4LjItNDMuNS01OC4yLTI4LjkgMC01Mi4zIDIzLjUtNTIuMyA1Mi4zIDAgMTQuNCAzLjMgMjcuNiA5LjIgMzkuOGwtMjQuNC0xNC4xYy0xMC45LTE4LjctMzAuNS0zMC45LTUyLjctMzAuOS0yNy44IDAtNTAuNSAyMC44LTUwLjUgNDYuNSAwIDEyLjIgMy42IDIzLjUgOS44IDMzLjVsLTI0LjQgMTQuMWMtOC4zLTE0LjQtMjMuNy0yMy41LTQxLTIzLjUtMjcuOCAwLTUwLjUgMjAuOC01MC41IDQ2LjUgMCA5LjkgMi43IDE5LjIgNy41IDI3LjhsMjQuNC0xNC4xYy03LjUtMTIuOS0yMC42LTIxLjMtMzUuOS0yMS4zLTI3LjggMC01MC41IDIwLjgtNTAuNSA0Ni41IDAgNy44IDIuNyAxNS4xIDcuNSAyMS4zbC0yNC40IDE0LjFjLTQuNy04LjEtMTUuMi0xMy4zLTI2LjItMTMuMy0yNy44IDAtNTAuNSAyMC44LTUwLjUgNDYuNSAwIDUuOCAxLjUgMTEuMyA0LjIgMTYuNWwtMjQuNC0xNC4xYy0yLjctNi44LTcuOS0xMi43LTE0LjktMTYuNS0yNy44IDAtNTAuNSAyMC44LTUwLjUgNDYuNSAwIDMuOSAwLjkgNy41IDIuMSAxMC45bC0yNC40IDE0LjFjLTEuMi0zLjUtMy43LTYuNy03LjQtOS41LTI3LjggMC01MC41IDIwLjgtNTAuNSA0Ni41IDAgMCAwIDAgMCAweiIgZmlsbD0iIzM3NzZhYiIvPjwvc3ZnPg==',
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48cGF0aCBkPSJNMTI1IDMwTDUwIDUwdjE1MEwxMjUgMjUwTDIwMCAyMDBWNTB6IiBmaWxsPSIjRkY2RjAwIi8+PHBhdGggZD0iTTEyNSA1MEw1MCAxMDB2MTUwTDEyNSAyMDBMMjAwIDE1MFYxMDB6IiBmaWxsPSIjRkY5NTAwIi8+PC9zdmc+',
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48cGF0aCBkPSJNMTI1IDUwTDUwIDEwMHYxNTBMMTI1IDIwMEwyMDAgMTUwVjEwMHoiIGZpbGw9IiNFRDMxMzUiLz48cGF0aCBkPSJNMTI1IDMwTDUwIDgwdjE1MEwxMjUgMjMwTDIwMCAxODBWODB6IiBmaWxsPSIjRjZENDAwIi8+PC9zdmc+',
  },
  {
    id: 'scikit-learn',
    name: 'Scikit-learn',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48Y2lyY2xlIGN4PSIxMjUiIGN5PSIxMjUiIHI9IjgwIiBmaWxsPSIjRjY5MDIwIi8+PHBhdGggZD0iTTEyNSA2MGwtNjAgNjB2NjBsNjAgNjB2LTZ6IiBmaWxsPSIjRkZiIi8+PC9zdmc+',
  },
  {
    id: 'opencv',
    name: 'OpenCV',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiByeD0iMjAiIGZpbGw9IiMwMDc5RDciLz48Y2lyY2xlIGN4PSIxMjUiIGN5PSIxMjUiIHI9IjQwIiBmaWxsPSIjRkZiIi8+PC9zdmc+',
  },
  {
    id: 'docker',
    name: 'Docker',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48cmVjdCB4PSI2MCIgeT0iNjAiIHdpZHRoPSIxMzAiIGhlaWdodD0iMTMwIiByeD0iMTUiIGZpbGw9IiMwMjk2Q0YiLz48cGF0aCBkPSJNODAgODBoMTAwdjgwSDgwVjg4em0yMCAyMGg2MHY0MEgxMDB2LTYweiIgZmlsbD0iI0ZGIi8+PC9zdmc+',
  },
  {
    id: 'github',
    name: 'GitHub',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48cGF0aCBkPSJNMTI1IDMwYy01My4zIDAtOTYuNSA0My4yLTk2LjUgOTYuNSAwIDguNSAxLjUgMTYuNSA0LjIgMjMuMyAzOC41LTE1IDc2LjgtNDYuNSA3Ni44LTQ2LjUgNzYuOC00Ni41IDEwOS4zIDYuNiAxMi44IDI1LjIgMTYuMiA0My42IDYuNSAzMy41IDM4LjQgNDMuOCA3MC44IDQzLjhWMTU2YzAtMzguNi0yMC43LTcxLjEtNTEuNS04Ny43IDE4LjUtNC4zIDM4LjQtMTQuNSA1MS44LTI5LjEgMS41LTIuOSAyLjItNi4xIDIuMi05LjIgMC02LjgtNC42LTEyLjYtMTAuOS0xNS44LTE5LjItNy43LTQ0LjgtMzAuNS00NC44LTMwLjUtNDQuOC0zMC41LTQ0LjgtMzAuNSAwLTM0LjEgMjguMi02MS45IDYyLjktNjEuOSA2MS45LTYxLjkgNjEuOSA2MS45IDYxLjkgNjEuOS02MS45IDYyLjktNjEuOSAyNy44IDE1LjUgNTEuOSA0NC44IDUxLjkgNDQuOCA0NC44IDQ0LjggNDQuOCAzMC41IDQ0LjggMzAuNS0zMC41IDQ0LjgtNTEuOSA2MS45LTYyLjkgNjEuOS02Mi45IDYyLjktNjEuOSAzNC43LTI4LjYgNjIuOS02MS45IDYyLjktNjEuOXoiIGZpbGw9IiMzMzMzMzMiLz48L3N2Zz4=',
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    image_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj48cGF0aCBkPSJNMTI1IDUwTDUwIDEwMHYxNTBMMTI1IDIwMEwyMDAgMTUwVjEwMHoiIGZpbGw9IiMwMDU5QTkiLz48cGF0aCBkPSJNMTI1IDMwTDUwIDgwdjE1MEwxMjUgMjMwTDIwMCAxODBWODB6IiBmaWxsPSIjMDA5Nzk4Ii8+PC9zdmc+',
  },
];
