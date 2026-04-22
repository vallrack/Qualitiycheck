SELECT id, name, documentId, grade, modality FROM student WHERE documentId = '9876543210';
SELECT modality, COUNT(*) FROM student GROUP BY modality;
