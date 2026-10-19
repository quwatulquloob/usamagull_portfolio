UPDATE site_settings
SET value = replace(value, 'Building production-scale AI that actually ships.', 'Building scalable AI systems that actually ship.')
WHERE key = 'profile';

UPDATE site_settings
SET value = replace(value, 'https://twitter.com', 'https://www.upwork.com/freelancers/~01440869ef56e8e97a')
WHERE key = 'contact';

UPDATE services
SET deliverables = replace(deliverables, 'Production RAG pipelines with vector databases', 'Enterprise RAG pipelines with vector databases')
WHERE id = 'agentic-ai';

UPDATE services
SET deliverables = replace(deliverables, 'Production deployment and monitoring systems', 'Automated deployment and monitoring systems')
WHERE id = 'ml-ai-systems';

UPDATE projects
SET full_details = replace(full_details, 'Designed and deployed a production RAG pipeline', 'Designed and deployed an enterprise RAG pipeline')
WHERE id = 'proj-1';

UPDATE awards
SET description = replace(description, 'production-grade LLM solution', 'enterprise-grade LLM solution'),
    why_it_matters = replace(why_it_matters, 'production-grade LLM architectures', 'enterprise-grade LLM architectures'),
    tags = replace(tags, 'Production LLMs', 'Enterprise LLMs')
WHERE id = 'cybhi-2025';

UPDATE awards
SET tags = replace(tags, 'Production AI Talk', 'AI Engineering Talk')
WHERE id = 'guest-speaker';
