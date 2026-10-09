function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.email;
    var requirementText = data.text;
    var requirementTextLower = requirementText.toLowerCase();
    
    // --- 1. EXTRACT DATA FOR SUBJECT LINE ---
    var lines = requirementText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    var rawRole = "";
    var locationStr = "";
    var empTypeStr = "";
    var visaStr = "";
    var locIndex = -1;

    // Words that mean a line is just a greeting, not a job title
    var greetings = ["hi", "hello", "hope", "dear", "greetings", "urgent", "good"];
    function isGreeting(text) {
        var lower = text.toLowerCase();
        return greetings.some(g => lower.startsWith(g));
    }

    for (var i = 0; i < lines.length; i++) {
        var lowerLine = lines[i].toLowerCase();
        
        // Find Location
        if ((lowerLine.startsWith("location") || lowerLine.startsWith("loc")) && !locationStr) {
            locationStr = lines[i].replace(/(location|loc)\s*(::|:|-)?\s*/i, "").trim();
            locIndex = i;
        }
        // Find Role with explicit labels
        else if ((lowerLine.includes("role:") || lowerLine.includes("title:") || lowerLine.includes("hiring:") || lowerLine.includes("we're hiring") || lowerLine.includes("we are hiring") || lowerLine.includes("position:")) && !rawRole) {
            rawRole = lines[i].replace(/(role|title|we're hiring|we are hiring|hiring|position)\s*(::|:|-)?\s*/gi, "").trim();
        }
        // Find Visa
        else if ((lowerLine.includes("visa") || lowerLine.includes("authorization") || lowerLine.includes("citizens") || lowerLine.includes("green card") || lowerLine.includes("usc") || lowerLine.includes("gc")) && !visaStr && lines[i].length < 80) {
            visaStr = lines[i].replace(/(work authorization|visa)\s*(::|:|-)?\s*/gi, "").trim();
        }
        // Find Employment Type / Duration
        else if ((lowerLine.includes("engagement") || lowerLine.includes("duration") || lowerLine.includes("c2c") || lowerLine.includes("w2") || lowerLine.includes("1099") || lowerLine.includes("rate:")) && !empTypeStr && lines[i].length < 80) {
            empTypeStr = lines[i].replace(/(engagement|duration|rate)\s*(::|:|-)?\s*/gi, "").trim();
        }
    }

    // Fallback 1: If no role found, grab the line right above Location
    if (!rawRole && locIndex > 0) {
        var potentialRole = lines[locIndex - 1];
        if (!isGreeting(potentialRole)) { rawRole = potentialRole; }
    }
    // Fallback 2: Grab the first line that isn't a greeting
    if (!rawRole) {
        for (var j = 0; j < lines.length; j++) {
            if (!isGreeting(lines[j]) && lines[j].length < 100) {
                rawRole = lines[j];
                break;
            }
        }
    }
    if (!rawRole) rawRole = "Data Engineer"; // Final safety net

    // Fallback for location if none was explicitly stated
    if (!locationStr) {
        if (requirementTextLower.includes("remote")) locationStr = "Remote";
        else if (requirementTextLower.includes("hybrid")) locationStr = "Hybrid";
    }

    // Build Massive Subject Line
    var subjectParts = [rawRole];
    if (locationStr) subjectParts.push(locationStr);
    if (empTypeStr) subjectParts.push(empTypeStr);
    if (visaStr) subjectParts.push(visaStr);
    subjectParts.push("I am interested in this position");
    var subject = subjectParts.join(" - ");

    // --- 2. CLEAN UP ROLE FOR EMAIL BODY ---
    // This removes emojis so the email body looks clean and professional
    var cleanRole = rawRole.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
    cleanRole = cleanRole.replace(/^[\s\|\-]+|[\s\|\-]+$/g, ''); // Remove stray dashes or pipes left behind


    // --- 3. TEMPLATE MAPPING & PARAGRAPHS ---
    var resumeFileId = "1kfsBHfzyfpl3bsXQJwnVG2klTDM2NB9M"; // Default
    var customParagraph = "With hands-on experience in <b>data pipeline development, ETL processes, and modern data architecture</b>, I am excited about the opportunity to contribute to your team and build scalable data solutions."; 
    
    if (requirementTextLower.includes("power bi") || requirementTextLower.includes("powerbi") || requirementTextLower.includes("fabric")) {
        resumeFileId = "15BRuCxffxFMm6Pojj3cHxhLR3kost86U";
        customParagraph = "With strong hands-on experience in <b>Power BI, SQL, Python, ETL/ELT, data modeling, DAX, Power Query, data visualization, interactive dashboards, report development, data pipeline development, Azure, and cloud-based data platforms</b>, along with expertise in transforming complex data into actionable business insights, I am confident in my ability to build scalable data solutions and contribute effectively to your team.";
    } else if (requirementTextLower.includes("big data") || requirementTextLower.includes("hadoop") || requirementTextLower.includes("kafka")) {
        resumeFileId = "1kfsBHfzyfpl3bsXQJwnVG2klTDM2NB9M"; 
        customParagraph = "With strong hands-on experience in <b>Big Data engineering, Apache Spark, PySpark, Hadoop, Hive, Kafka, Python, SQL, ETL/ELT, real-time data processing, batch processing, data pipeline development, AWS, and Snowflake</b>, I am confident in my ability to handle complex data workloads and contribute effectively to your team.";
    } else if (requirementTextLower.includes("machine learning") || requirementTextLower.includes(" ml ") || requirementTextLower.includes(" ai ") || requirementTextLower.includes("artificial intelligence")) {
        resumeFileId = "1qCHthzVRkgvYwNL9vIp7-7qE83Nb4IRW";
        customParagraph = "With strong hands-on experience in <b>Generative AI, RAG (Retrieval-Augmented Generation), and Agentic AI</b>, along with expertise in <b>Python, LangChain, LangGraph, LLMs, Prompt Engineering, Vector Databases, Embeddings, AI Agents, NLP, Machine Learning, and cloud-based AI solutions</b>, I am confident in my ability to develop scalable, intelligent AI solutions and contribute effectively to your team.";
    } else if (requirementTextLower.includes("gcp") || requirementTextLower.includes("google cloud")) {
        resumeFileId = "1mPHdvI2shRRELudaVKR7ygUQqsCfSP0g";
        customParagraph = "With hands-on experience in data pipeline development, ETL/ELT processes, and GCP cloud services like <b>Google Cloud Storage (GCS), BigQuery, and Dataflow</b>, along with deep expertise in <b>Databricks, Apache Spark, PySpark, SQL, and Python</b>, I am excited about the opportunity to contribute to your team.";
    } else if (requirementTextLower.includes("snowflake") || requirementTextLower.includes("aws") || requirementTextLower.includes("redshift")) {
        resumeFileId = "1kfsBHfzyfpl3bsXQJwnVG2klTDM2NB9M";
        customParagraph = "With hands-on experience in <b>data pipeline development, ETL processes, and cloud platforms like AWS (Redshift, S3)</b>, and expertise in tools like <b>Apache Spark and Python</b>, I am excited about the opportunity to contribute to your team.";
    } else if (requirementTextLower.includes("azure") && requirementTextLower.includes("databricks")) {
        resumeFileId = "1JCOfIIEaPJ2ih7veEgC0llTi4RCYJNIS";
        customParagraph = "With hands-on experience in data pipeline development, ETL/ELT processes, and Azure cloud services like <b>Azure Data Factory (ADF), Azure Data Lake Storage Gen2 (ADLS Gen2), and Azure Databricks</b>, along with expertise in <b>Apache Spark, PySpark, SQL, and Python</b>, I am excited about the opportunity to contribute to your team.";
    } else if (requirementTextLower.includes("azure")) {
        resumeFileId = "1n4zViWk_1QIiXOQ_jJvuAMuVUrOBK46Q";
        customParagraph = "With hands-on experience in data pipeline development, ETL/ELT processes, and Azure cloud services like <b>Azure Data Factory (ADF), Azure Data Lake Storage Gen2 (ADLS Gen2), and Azure Databricks</b>, along with expertise in <b>Apache Spark, PySpark, SQL, and Python</b>, I am excited about the opportunity to contribute to your team.";
    } else if (requirementTextLower.includes("business analyst") || requirementTextLower.includes(" ba ")) {
        resumeFileId = "1OrB4LsHO1prCEAlqIvHRBXm5JamMeihv";
        customParagraph = "With strong experience in business analysis, requirements gathering, stakeholder collaboration, data analysis, process improvement, and translating business requirements into technical solutions, along with expertise in <b>SQL, Excel, Power BI, data visualization, and reporting</b>, I am confident in my ability to bridge business and technical teams and contribute effectively to your organization.";
    } else if (requirementTextLower.includes("data analyst") || requirementTextLower.includes("analytics")) {
        resumeFileId = "1OrB4LsHO1prCEAlqIvHRBXm5JamMeihv";
        customParagraph = "With strong hands-on experience in <b>data analysis, SQL, Python, data transformation, ETL processes, and developing actionable insights</b> from complex datasets, along with expertise in <b>Power BI, Tableau, data visualization, and cloud-based data platforms</b>, I am confident in my ability to support data-driven decision-making and contribute effectively to your team.";
    } else if (requirementTextLower.includes("salesforce")) {
        resumeFileId = "1QxDPtYokbQpp-c8vOJNa8CtkMiC1V188";
        customParagraph = "With strong experience in <b>data analysis, reporting, and utilizing platforms like Salesforce</b> to drive actionable insights, I am confident in my ability to contribute effectively to your team.";
    } else if (requirementTextLower.includes("data quality")) {
        resumeFileId = "1LhdyAx6OqsrWglInnCgIs9gMBqbfc31Q";
        customParagraph = "With strong hands-on experience in <b>data quality assurance, data governance, and implementing robust validation frameworks</b>, I am excited about the opportunity to ensure the integrity of your data ecosystems and contribute to your team.";
    }

    // --- 4. EXTRACT RECRUITER NAME ---
    var emailPrefix = recipient.split('@')[0].toLowerCase();
    emailPrefix = emailPrefix.replace(/[0-9]/g, ''); 
    var firstNameRaw = emailPrefix.split(/[\.\-_]/)[0]; 
    
    var genericNames = ['hr', 'info', 'jobs', 'careers', 'admin', 'recruit', 'recruiting', 'recruitment', 'team', 'support', 'hello', 'contact', 'apply', 'resume', 'sales'];
    var greeting = "Dear,"; 
    
    if (firstNameRaw.length > 1 && !genericNames.includes(firstNameRaw)) {
        var capitalizedName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);
        greeting = "Dear " + capitalizedName + ",";
    }

    // --- 5. BUILD FINAL HTML EMAIL ---
    var htmlBody = `
    <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000;">
        <p>${greeting}</p>
        <p>Good day!</p>
        <p>I trust this email finds you well. My name is <b>Himavanth Mallela</b>, and I recently came across the <b>${cleanRole}</b> position on <b>LinkedIn</b>. After reviewing the job description, I am confident that my experience aligns closely with your requirements.</p>
        <p>${customParagraph}</p>
        <p>Please find my resume attached for your consideration. I would welcome the chance to discuss how I can add value to your organization.</p>
        <p>Looking forward to hearing from you.</p>
        <br>
        <p><b>Best Regards,<br><br>Himavanth Mallela<br>Phone: +1 (314) 393 5056<br>Email: himavanth.mallela.hm@gmail.com</b></p>
    </div>
    `;
    
    // --- 6. ATTACH DOCX AND CREATE DRAFT ---
    var draftOptions = {};
    if (resumeFileId) {
       var fileBlob = DriveApp.getFileById(resumeFileId).getBlob();
       fileBlob.setName("Himavanth_Mallela_Resume.docx"); 
       draftOptions.attachments = [fileBlob];
    }
    
    draftOptions.htmlBody = htmlBody;
    GmailApp.createDraft(recipient, subject, "", draftOptions);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "Draft created successfully"}))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}