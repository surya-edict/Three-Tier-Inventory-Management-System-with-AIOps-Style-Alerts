# Mega Inventory: 30 Interview Q&A Guide

This guide contains 30 essential interview questions, answers, and follow-ups related to the Mega Inventory Management System project.

---

## **Part 1: Architecture & General (5 Questions)**

### **Q1: Can you explain the high-level architecture of this project?**
**Answer:** It is a professional three-tier cloud-native application. 
- **Frontend:** React.js for the UI.
- **Backend:** FastAPI (Python) for the business logic.
- **Database:** PostgreSQL for persistent storage.
- **Infrastructure:** Deployed on AWS EKS (Kubernetes) using Terraform and managed via ArgoCD (GitOps).

**Follow-up:** Why did you choose FastAPI over Flask or Django?
**Follow-up Answer:** FastAPI is modern, faster (asynchronous), and provides automatic Swagger documentation and data validation using Pydantic, which is great for production.

---

### **Q2: What is the "AIOps-style" alerting mentioned in your project?**
**Answer:** It mimics real-world AIOps by using Prometheus metrics to proactively detect issues. Instead of waiting for a crash, we set rules to alert us when stock is low or API latency is high, allowing for automated responses like scaling pods or sending notifications.

**Follow-up:** How does this differ from traditional monitoring?
**Follow-up Answer:** Traditional monitoring tells you what happened; our "proactive" setup alerts you before a critical failure occurs, allowing for "self-healing" or early intervention.

---

### **Q3: Why did you use Terraform instead of manual AWS setup?**
**Answer:** Using Terraform (Infrastructure as Code) ensures that the infrastructure is version-controlled, repeatable, and documented. It prevents "configuration drift" where manual changes make environments inconsistent.

**Follow-up:** How do you handle Terraform state?
**Follow-up Answer:** I used a remote S3 backend with DynamoDB locking to prevent state corruption when multiple people (or CI/CD) run Terraform at once.

---

### **Q4: What is GitOps and how did you implement it?**
**Answer:** GitOps means using a Git repository as the "source of truth" for infrastructure and deployments. I used **ArgoCD**. It watches my Kubernetes manifests folder and automatically syncs the cluster state whenever I push a change to GitHub.

**Follow-up:** What happens if someone manually changes a setting in the cluster?
**Follow-up Answer:** ArgoCD will detect the "out of sync" state and automatically revert the manual change to match what is in Git.

---

### **Q5: How do the different components (Frontend, Backend, DB) communicate?**
**Answer:** The Frontend calls the Backend REST API. The Backend connects to the PostgreSQL database using an ORM (SQLAlchemy). In Kubernetes, we use ClusterIP Services for internal communication and an Ingress (ALB) for external access.

---

## **Part 2: Backend & Database (7 Questions)**

### **Q6: How do you handle race conditions in the inventory (e.g., two users buying the last item)?**
**Answer:** I implemented **Row-level Locking** using SQLAlchemy's `.with_for_update()`. This locks the specific product row in the database during a transaction, so no other process can modify the quantity until the first transaction is finished.

**Follow-up:** What is the downside of row-level locking?
**Follow-up Answer:** It can slightly slow down performance under extremely high concurrency, but it is necessary for data integrity in financial or inventory systems.

---

### **Q7: What is the purpose of the "Inventory Movements" table?**
**Answer:** It acts as an **audit ledger**. Instead of just changing the quantity number, every single change (Sale, Restock, Adjustment) is recorded as a separate movement. This provides a full history of why stock changed.

**Follow-up:** Why not just use the Orders table for this?
**Follow-up Answer:** The Orders table only tracks sales. The Movements table tracks everything, including manual stock counts and restocks from suppliers.

---

### **Q8: How did you handle data validation in the Backend?**
**Answer:** I used **Pydantic schemas**. They define exactly what data is allowed (e.g., price must be a positive float). If a user sends invalid data, FastAPI automatically returns a clear 422 error.

---

### **Q9: Why did you use PostgreSQL instead of a NoSQL database like MongoDB?**
**Answer:** Inventory management is highly relational (Products belong to Suppliers, Orders belong to Products). SQL databases provide **ACID compliance**, which is critical for ensuring stock numbers are always accurate.

---

### **Q10: What is "Archive instead of Delete" and why is it important?**
**Answer:** In professional systems, we rarely delete data. If we delete a product, we lose its sales history. Instead, we use a `is_active` boolean flag. This "hides" the product from the UI but keeps the history safe.

---

### **Q11: How do you handle large lists of data in the API?**
**Answer:** Currently, I use basic filtering, but for production, I would implement **Pagination** (sending data in small chunks like 20 items at a time) to prevent the frontend and backend from slowing down.

---

### **Q12: What are custom Prometheus metrics in your application?**
**Answer:** I exposed custom metrics like `inventory_stock_level` and `inventory_low_stock_products` using the Prometheus Python client. This allows Prometheus to track our specific business data, not just CPU/RAM usage.

---

## **Part 3: Frontend (4 Questions)**

### **Q13: Why did you choose React with Chakra UI?**
**Answer:** React is highly modular and fast. Chakra UI provides accessible, professional-looking components (like Modals and Tables) out of the box, which allowed me to focus on the inventory logic rather than CSS.

---

### **Q14: How does the Frontend stay in sync with the Backend?**
**Answer:** I used **React Query**. It handles data fetching, caching, and "automatic invalidation" (refreshing the list automatically after I add or delete a product).

---

### **Q15: How did you handle the "Empty State" in your dashboard?**
**Answer:** I added a "Low Stock Triage" panel and aggregate KPI cards. If there is no data, the UI shows friendly messages or empty states instead of just a blank screen or errors.

---

### **Q16: How do you handle navigation between different inventory modules?**
**Answer:** I used **React Router**. It allows for a single-page application experience where users can switch between Products, Suppliers, and Orders without the page reloading.

---

## **Part 4: DevOps & CI/CD (8 Questions)**

### **Q17: Explain your CI/CD pipeline flow.**
**Answer:** 
1. Developer pushes code.
2. GitHub Actions runs tests.
3. It builds Docker images for Frontend and Backend.
4. **Trivy** scans the images for security vulnerabilities.
5. Images are pushed to Amazon ECR.
6. Manifests are updated, and ArgoCD syncs them to EKS.

---

### **Q18: What is OIDC and why is it better than AWS Access Keys in GitHub?**
**Answer:** OIDC (OpenID Connect) allows GitHub Actions to authenticate with AWS using short-lived, temporary tokens. This is much more secure than storing long-lived `AWS_ACCESS_KEY_ID` secrets in GitHub, which could be leaked.

---

### **Q19: What security measures did you take for your Docker images?**
**Answer:** 
1. **Multi-stage builds** to keep image size small.
2. Running as a **non-root user** (`appuser`) to prevent container breakout attacks.
3. Automated **Trivy scanning** in the CI pipeline to block builds with critical vulnerabilities.

---

### **Q20: How did you implement Zero Trust Networking in Kubernetes?**
**Answer:** I used **Kubernetes Network Policies**. By default, all communication is denied. I explicitly allowed only the Frontend pods to talk to the Backend pods, and the Backend pods to talk to the Database.

---

### **Q21: What is the purpose of HPA in your cluster?**
**Answer:** The **Horizontal Pod Autoscaler** automatically increases or decreases the number of pods based on CPU/Memory usage or custom Prometheus metrics, ensuring the app stays responsive during high traffic.

---

### **Q22: How do you handle application secrets (like DB passwords) in Kubernetes?**
**Answer:** I used **Kubernetes Secrets**. In a real enterprise setup, I would integrate these with **AWS Secrets Manager** using the External Secrets Operator for better security.

---

### **Q23: Why did you include a `manual-test-checklist.md`?**
**Answer:** In a professional environment, automated tests are great, but a manual QA checklist ensures the "user experience" is verified and serves as a guide for anyone reviewing the project.

---

### **Q24: What is the role of the ALB Ingress Controller?**
**Answer:** It acts as the "front door" of the cluster. It automatically provisions an AWS Application Load Balancer and routes external traffic to the correct Kubernetes Service based on the URL path.

---

## **Part 5: Cloud FinOps & Optimization (6 Questions)**

### **Q25: How did you optimize costs for this project?**
**Answer:** 
1. Used **AWS Graviton (ARM64)** instances (20% cheaper).
2. Used **Spot Instances** for stateless application pods.
3. Implemented **VPC Endpoints** to avoid NAT Gateway data transfer costs.

---

### **Q26: What is the benefit of AWS Graviton for this project?**
**Answer:** Graviton processors provide significantly better price-performance for Python (FastAPI) and Node.js (React) workloads compared to standard x86 processors.

---

### **Q27: When should you NOT use Spot Instances?**
**Answer:** Spot instances can be taken back by AWS at any time. Therefore, they should not be used for databases (like RDS) or any stateful application that cannot handle sudden shutdowns.

---

### **Q28: How does using a VPC Endpoint save money?**
**Answer:** Without a VPC Endpoint, traffic to S3 or ECR has to go through a NAT Gateway, which charges for every gigabyte of data. VPC Endpoints keep that traffic internal to the AWS network, making it much cheaper.

---

### **Q29: How would you scale this for millions of products?**
**Answer:** I would add **Database Indexing**, implement **Redis Caching** for frequent lookups, and potentially move to a **Microservices** architecture if the team grew.

---

### **Q30: What was the biggest challenge you faced in this project?**
**Answer:** (Personal answer, but recommended:) "Managing the OIDC authentication between GitHub and AWS while ensuring the Terraform state remained consistent across multiple runs."

---
