const studentId = 'cmo92qaj20000w8w3kbk3cjkg';

async function testAI() {
  console.log('Testing AI PHVA Analysis for student:', studentId);
  try {
    // Note: We can't easily call the API route directly via fetch here because of auth
    // But we can test the AIOrchestrator directly
    const { AIOrchestrator } = require('./src/lib/ai/orchestrator');
    const { prisma } = require('./src/lib/db/prisma');
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { evaluations: { include: { subject: true } } }
    });
    
    if (!student) {
      console.error('Student not found');
      return;
    }
    
    const analysis = await AIOrchestrator.analyzePerformance({
      studentName: student.name,
      subject: 'Matemáticas',
      modality: student.modality,
      grades: student.evaluations.map((e: any) => ({
        period: e.period,
        score: e.finalScore,
        subject: e.subject.name
      }))
    });
    
    console.log('AI Analysis Result:');
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAI();
