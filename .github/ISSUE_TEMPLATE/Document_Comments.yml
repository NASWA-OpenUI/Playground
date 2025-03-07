name: Document Comment or Question
description: Leave a comment or ask a question about a specific document
title: "[DOC]: "
labels: ["documentation", "feedback"]
assignees:
  - 
body:
  - type: markdown
    attributes:
      value: |
        ## Document Feedback Form
        Use this template to provide comments, ask questions, or suggest improvements for specific documents.
  
  - type: dropdown
    id: document-type
    attributes:
      label: Document Type
      description: What type of document are you commenting on?
      options:
        - Project Documentation
        - Meeting Notes
        - Report
        - Specification
        - User Guide
        - Technical Reference
        - Other (please specify in comments)
    validations:
      required: true
      
  - type: input
    id: document-name
    attributes:
      label: Document Name or Path
      description: Please provide the name or path of the document you're referring to
      placeholder: "e.g., /docs/user-guide.md or Meeting Notes - Feb 2025"
    validations:
      required: true
      
  - type: dropdown
    id: comment-type
    attributes:
      label: Type of Comment
      description: What type of comment or feedback are you providing?
      options:
        - Question about content
        - Suggestion for improvement
        - Reporting inaccuracy or outdated information
        - Request for clarification
        - General feedback
    validations:
      required: true
      
  - type: textarea
    id: comment-details
    attributes:
      label: Comment Details
      description: Please provide your comment, question, or suggestion
      placeholder: Be as specific as possible. If referring to a specific section, please include the section name or page number.
    validations:
      required: true
      
  - type: textarea
    id: suggested-changes
    attributes:
      label: Suggested Changes (if applicable)
      description: If you're suggesting specific changes, please provide details here
      placeholder: "For example: 'I suggest changing X to Y because...'"
      
  - type: checkboxes
    id: acknowledgement
    attributes:
      label: Acknowledgement
      options:
        - label: I've verified this comment hasn't already been submitted by someone else
          required: true
