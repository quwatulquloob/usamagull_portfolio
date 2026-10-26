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
    "id": "agentic-ai",
    "title": "Agentic AI & LLM Systems",
    "category": "Conversational AI",
    "description": "Build AI chatbots and LangGraph workflows with document retrieval, tool calling, speech input, and structured report generation.",
    "deliverables": [
      "LangGraph chatbot and agent workflows",
      "RAG from internal documents and websites",
      "Tool calling and API integration",
      "Prompt development and LLM evaluation"
    ],
    "tags": [
      "Python",
      "LangGraph",
      "LangChain",
      "RAG"
    ],
    "price": 0,
    "price_suffix": ""
  },
  {
    "id": "computer-vision",
    "title": "Computer Vision & Model Deployment",
    "category": "Computer Vision",
    "description": "Develop detection, segmentation, and image analysis models, and integrate inference into web, mobile, and mixed reality applications.",
    "deliverables": [
      "Custom detection and segmentation models",
      "Dataset preparation and model evaluation",
      "Image and video analysis pipelines",
      "Model deployment and application integration"
    ],
    "tags": [
      "YOLOv8/11",
      "OpenCV",
      "PyTorch",
      "TensorFlow"
    ],
    "price": 0,
    "price_suffix": ""
  },
  {
    "id": "voice-ai",
    "title": "Voice AI Assistants",
    "category": "Voice AI",
    "description": "Build knowledge-grounded voice assistants with Vapi, LLMs, Whisper, ElevenLabs, and Twilio, supported by Python backends.",
    "deliverables": [
      "Knowledge retrieval from documents and websites",
      "Speech-to-text and text-to-speech integration",
      "Inbound and outbound Twilio calling",
      "Django backend orchestration"
    ],
    "tags": [
      "Vapi",
      "Whisper",
      "ElevenLabs",
      "Twilio",
      "Django"
    ],
    "price": 0,
    "price_suffix": ""
  },
  {
    "id": "ml-ai-systems",
    "title": "Machine Learning & Analytics",
    "category": "Machine Learning",
    "description": "Build predictive models and analytics applications for forecasting, customer segmentation, and business decision-making.",
    "deliverables": [
      "Data preparation and feature engineering",
      "Model training, tuning, and evaluation",
      "Forecasting and customer segmentation",
      "Backend integration and analytics dashboards"
    ],
    "tags": [
      "Python",
      "Scikit-Learn",
      "TensorFlow",
      "Flask"
    ],
    "price": 0,
    "price_suffix": ""
  },
  {
    "id": "mlops-deployment",
    "title": "AI Backends & Production Deployment",
    "category": "Python Engineering",
    "description": "Develop Django, Flask, and FastAPI backends, integrate external APIs and billing, and deploy AI applications with cloud infrastructure.",
    "deliverables": [
      "Python REST APIs and application backends",
      "Authentication and role-based access",
      "Third-party API and subscription integration",
      "Containerization, deployment, and issue resolution"
    ],
    "tags": [
      "Django",
      "Flask",
      "FastAPI",
      "Docker",
      "AWS"
    ],
    "price": 0,
    "price_suffix": ""
  }
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
    "id": "proj-1",
    "title": "Automated Roof Measurement System",
    "category": "vision",
    "description": "YOLOv8 roof segmentation and polygonization with a FastAPI backend and Google Maps API integration.",
    "full_details": "Built a computer vision system for roof segmentation and polygonization using 3.5k satellite images. Integrated a FastAPI backend with the Google Maps API. Reduced report generation time from 2-3 days to under 30 seconds and data acquisition costs by 90%.",
    "client": "Project at Cplusoft",
    "stack": "Python, YOLOv8, FastAPI, Google Maps API",
    "impact": "Reports in under 30 seconds; 90% lower data acquisition costs",
    "duration": "",
    "gradient": "linear-gradient(135deg, #2b4bff, #101c35)"
  },
  {
    "id": "proj-2",
    "title": "CYBHI - AI Chatbot Orchestration",
    "category": "agentic",
    "description": "LangGraph chatbot workflows for school incident reporting and student support on a California government-funded platform.",
    "full_details": "Lead a team of AI developers as Senior AI Engineer on CYBHI at Cplusoft. Developed LangGraph chatbot orchestration with speech-to-text input, scenario analysis, multi-perspective validation, and automated reports. Built guided report creation and report-linked billing, and managed production deployment, optimization, and issue resolution.",
    "client": "Project at Cplusoft",
    "stack": "Python, LangGraph, LLMs, Speech-to-Text, API Integration",
    "impact": "Guided incident reporting, student support, and automated report generation",
    "duration": "",
    "gradient": "linear-gradient(135deg, #2b4bff, #101c35)"
  },
  {
    "id": "proj-3",
    "title": "Prism - Retail Intelligence Platform",
    "category": "platforms",
    "description": "Machine learning for pharmacy sales forecasting, customer segmentation, and inventory management, with a Flask analytics dashboard.",
    "full_details": "Architected a retail intelligence platform for pharmacies. Trained models for customer segmentation, sales prediction, and demand forecasting on real-time retail data. Built a Flask backend with authentication, role-based access control, and a dynamic analytics dashboard.",
    "client": "Project at Cplusoft",
    "stack": "Python, Machine Learning, Flask, REST APIs, Analytics",
    "impact": "Sales forecasting, customer segmentation, and inventory insights",
    "duration": "",
    "gradient": "linear-gradient(135deg, #2b4bff, #101c35)"
  },
  {
    "id": "proj-4",
    "title": "Bone Metastasis Detection",
    "category": "vision",
    "description": "Computer vision models for detecting bone metastasis in X-ray images using the BS80k dataset.",
    "full_details": "Developed a computer vision system at Highfive Electronics for bone metastasis detection from X-ray images. Trained and evaluated multiple detection models on the BS80k dataset to support diagnostic analysis and clinical decision-making.",
    "client": "Project at Highfive Electronics",
    "stack": "Python, Computer Vision, Deep Learning, BS80k",
    "impact": "Detection model training and evaluation for medical image analysis",
    "duration": "",
    "gradient": "linear-gradient(135deg, #2b4bff, #101c35)"
  },
  {
    "id": "proj-5",
    "title": "Brainiatic - AI Voice Assistant Platform",
    "category": "agentic",
    "description": "Agentic voice assistants grounded in website and document content, with Vapi, Whisper, ElevenLabs, Twilio, and a Django backend.",
    "full_details": "Built an agentic AI voice assistant platform using Vapi and LLMs. Developed retrieval pipelines from scraped websites and ingested documents, with Whisper speech-to-text, ElevenLabs text-to-speech and voice cloning, and Twilio inbound and outbound calls. Built a Django backend to orchestrate data processing and real-time voice responses.",
    "client": "Project at Cplusoft",
    "stack": "Python, Django, Vapi, RAG, Whisper, ElevenLabs, Twilio",
    "impact": "Knowledge-grounded voice assistants with inbound and outbound calling",
    "duration": "",
    "gradient": "linear-gradient(135deg, #2b4bff, #101c35)"
  },
  {
    "id": "proj-6",
    "title": "AI Model Deployment - Flutter & HoloLens 2",
    "category": "vision",
    "description": "Deployed AI models in Flutter applications and YOLOv8 on Microsoft HoloLens 2 for real-time mixed reality inference.",
    "full_details": "At Highfive Electronics, deployed facial expression recognition, acne detection, and stroke detection models within a Flutter application. Also deployed a YOLOv8 model on Microsoft HoloLens 2 for real-time mixed reality inference.",
    "client": "Project at Highfive Electronics",
    "stack": "Python, YOLOv8, Flutter, Microsoft HoloLens 2",
    "impact": "AI inference integrated into mobile and mixed reality applications",
    "duration": "",
    "gradient": "linear-gradient(135deg, #2b4bff, #101c35)"
  },
  {
    "id": "acne-detection-and-recognition-system",
    "title": "Acne Detection & Recognition",
    "category": "vision",
    "description": "An acne detection model integrated into a Flutter mobile application.",
    "full_details": "Developed and deployed an acne detection model within a Flutter application as part of the AI model deployment work at Highfive Electronics.",
    "client": "Project at Highfive Electronics",
    "stack": "Python, Computer Vision, Flutter",
    "impact": "Acne detection integrated into a mobile application",
    "duration": "",
    "gradient": "linear-gradient(135deg, #2b4bff, #101c35)"
  }
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
    "id": "cybhi-2025",
    "title": "AI Team Leadership on CYBHI",
    "year": "Current role",
    "issuer": "Cplusoft - CYBHI",
    "status_pill": "Professional Contribution",
    "description": "Lead a team of AI developers as Senior AI Engineer on CYBHI, a California government-funded platform for school incident reporting and student support. Build LangGraph workflows, speech-to-text input, validation, report generation, and report-linked billing.",
    "why_it_matters": "Combines AI team leadership, chatbot orchestration, backend integration, and production delivery in a public-sector project.",
    "tags": [
      "LangGraph",
      "Team Leadership",
      "School Incident Reporting",
      "Production AI"
    ]
  },
  {
    "id": "certifications-ai",
    "title": "Applied AI Courses & Certifications",
    "year": "Professional learning",
    "issuer": "DeepLearning.AI & Udemy",
    "status_pill": "Continued Learning",
    "description": "Completed PyTorch for Deep Learning, RAG in Action, and LangChain for LLM Application from DeepLearning.AI, and The Complete Agent & MCP Course from Udemy.",
    "why_it_matters": "Continued learning in deep learning, retrieval-augmented generation, LLM applications, and agent development.",
    "tags": [
      "PyTorch",
      "RAG",
      "LangChain",
      "Agents & MCP"
    ]
  }
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
