import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { validateRole } from '@/lib/user-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      const programs = await prisma.program.findMany({
        include: { _count: { select: { students: true, subjects: true } } }
      });
      return NextResponse.json(programs);
    }

    // 1. Fetch Program and its related data
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        students: { include: { evaluations: true } },
        subjects: { include: { plans: true } },
        surveys: { orderBy: { date: 'desc' }, take: 1 },
        audits: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    if (!program) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });

    // 2. Calculate Academic KPIs
    let totalEvaluations = 0;
    let sumGrades = 0;
    let approvedCount = 0;
    
    program.students.forEach(student => {
      student.evaluations.forEach(evalu => {
        totalEvaluations++;
        sumGrades += evalu.finalScore;
        if (evalu.finalScore >= 3.0) approvedCount++;
      });
    });

    const approvalRate = totalEvaluations > 0 ? (approvedCount / totalEvaluations) * 100 : 0;
    const averageGrade = totalEvaluations > 0 ? (sumGrades / totalEvaluations) : 0;

    // 3. Calculate Curriculum Coverage
    const totalSubjects = program.subjects.length;
    const subjectsWithPlans = program.subjects.filter(s => s.plans.length > 0).length;
    const curriculumCoverage = totalSubjects > 0 ? (subjectsWithPlans / totalSubjects) * 100 : 0;

    // 4. Get latest survey score
    const latestSurvey = program.surveys[0];
    const satisfaction = latestSurvey ? latestSurvey.averageScore : 0;

    return NextResponse.json({
      program,
      stats: {
        approvalRate,
        averageGrade,
        curriculumCoverage,
        satisfaction,
        studentCount: program.students.length,
        subjectCount: totalSubjects,
        latestSurvey
      }
    });
  } catch (error: any) {
    console.error('Quality Evaluation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { authenticated, authorized } = await validateRole(['ADMIN', 'COORDINADOR']);
  if (!authenticated || !authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { programId, standard, findings, checklistResults, manualKpis } = await req.json();

    // Re-run aggregation for the audit
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        students: { include: { evaluations: true } },
        subjects: { include: { plans: true } },
        surveys: { orderBy: { date: 'desc' }, take: 1 }
      }
    });

    if (!program) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });

    // (Simplified aggregation logic for POST)
    const totalEvals = program.students.reduce((acc, s) => acc + s.evaluations.length, 0);
    const approved = program.students.reduce((acc, s) => acc + s.evaluations.filter(e => e.finalScore >= 3.0).length, 0);
    
    // Use manual KPIs if provided, otherwise use calculated ones
    const approvalRate = manualKpis ? manualKpis.approvalRate : (totalEvals > 0 ? (approved / totalEvals) * 100 : 0);
    const coverage = manualKpis ? manualKpis.curriculumCoverage : (program.subjects.length > 0 ? (program.subjects.filter(s => s.plans.length > 0).length / program.subjects.length) * 100 : 0);
    const satisfaction = manualKpis ? manualKpis.satisfaction : (program.surveys[0]?.averageScore || 0);
    const averageGrade = manualKpis ? manualKpis.averageGrade : 0;

    // 5. Call AI Master Auditor
    const auditResult = await AIOrchestrator.masterAuditProgram({
      programName: program.name,
      standard,
      kpis: {
        approvalRate,
        retentionRate: 95, // Mocked for now
        satisfaction
      },
      curriculumCoverage: coverage,
      normativeChecklist: checklistResults,
      findings
    });

    // 6. Save Audit Result
    const audit = await prisma.programAudit.create({
      data: {
        programId,
        standard,
        score: auditResult.score,
        findings: auditResult as any,
        actionPlan: auditResult.actionPlan,
        auditorId: 'ANTIGRAVITY_AI'
      }
    });

    return NextResponse.json(audit);
  } catch (error: any) {
    console.error('AI Audit Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
