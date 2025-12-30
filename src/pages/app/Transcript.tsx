import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { calculateCGPA, generateTranscript } from '@/lib/gpa';
import { Download, GraduationCap, Award } from 'lucide-react';
import { format } from 'date-fns';
import { percentToLetter, getGradeScale } from '@/lib/gradeScale';
import { calculateCourseAverage } from '@/lib/courseMath';

export default function Transcript() {
  const semesters = useWorkspaceStore((state) => state.getSemesters());
  const courses = useWorkspaceStore((state) => state.getCourses());
  const user = useWorkspaceStore((state) => state.getUser());

  const gpaScale = user?.gpaScale || 4.0;
  const gradeScale = getGradeScale(gpaScale);
  const transcriptData = generateTranscript(semesters, courses, gpaScale);
  const cgpaResult = calculateCGPA(courses, gpaScale);

  const handleExportCSV = () => {
    const headers = ['Semester', 'Course Code', 'Course Name', 'Credits', 'Grade', 'Points'];
    const rows: string[][] = [];

    transcriptData.forEach((semesterData) => {
      semesterData.courses
        .filter((c) => c.finalGradeConfirmed)
        .forEach((course) => {
          const points = gradeScale.ranges.find((r) => r.letter === course.finalLetterGrade)?.points || 0;
          rows.push([
            semesterData.semester.name,
            course.code,
            course.name,
            course.credits.toString(),
            course.finalLetterGrade || 'N/A',
            points.toString(),
          ]);
        });

      // Add semester GPA row
      rows.push([
        `${semesterData.semester.name} GPA`,
        '',
        '',
        semesterData.credits.toString(),
        '',
        semesterData.gpa.toString(),
      ]);
      rows.push([]); // Empty row
    });

    // Add CGPA row
    rows.push(['CGPA', '', '', cgpaResult.totalCredits.toString(), '', cgpaResult.gpa.toString()]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (semesters.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Academic Transcript</h1>
            <p className="text-muted-foreground">View your complete academic record</p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Transcript Data</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Add semesters and complete courses to build your academic transcript.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Transcript</h1>
          <p className="text-muted-foreground">
            {user?.name} • {user?.email}
          </p>
        </div>
        <Button onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* CGPA Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Cumulative GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{cgpaResult.gpa.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">
              Scale: {gpaScale}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cgpaResult.totalCredits}</div>
            <p className="text-sm text-muted-foreground">
              {cgpaResult.includedCourses} courses completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Semesters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{semesters.length}</div>
            <p className="text-sm text-muted-foreground">
              {semesters.filter((s) => s.isCurrent).length} current
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Semester-by-Semester Breakdown */}
      <div className="space-y-4">
        {transcriptData.map((semesterData) => {
          const confirmedCourses = semesterData.courses.filter((c) => c.finalGradeConfirmed);
          const inProgressCourses = semesterData.courses.filter((c) => !c.finalGradeConfirmed);

          return (
            <Card key={semesterData.semester.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {semesterData.semester.name}
                      {semesterData.semester.isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(semesterData.semester.startDate, 'MMM d, yyyy')} -{' '}
                      {format(semesterData.semester.endDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {semesterData.gpa > 0 ? semesterData.gpa.toFixed(2) : 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Semester GPA</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {confirmedCourses.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Completed Courses</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left p-2 font-medium">Code</th>
                            <th className="text-left p-2 font-medium">Course Name</th>
                            <th className="text-center p-2 font-medium">Credits</th>
                            <th className="text-center p-2 font-medium">Grade</th>
                            <th className="text-center p-2 font-medium">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {confirmedCourses.map((course) => {
                            const points = gradeScale.ranges.find(
                              (r) => r.letter === course.finalLetterGrade
                            )?.points || 0;

                            return (
                              <tr key={course.id} className="border-b">
                                <td className="p-2 font-medium">{course.code}</td>
                                <td className="p-2">{course.name}</td>
                                <td className="p-2 text-center">{course.credits}</td>
                                <td className="p-2 text-center">
                                  <Badge variant="default">{course.finalLetterGrade}</Badge>
                                </td>
                                <td className="p-2 text-center font-medium">
                                  {points.toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {inProgressCourses.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">In Progress</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left p-2 font-medium">Code</th>
                            <th className="text-left p-2 font-medium">Course Name</th>
                            <th className="text-center p-2 font-medium">Credits</th>
                            <th className="text-center p-2 font-medium">Current Avg</th>
                            <th className="text-center p-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inProgressCourses.map((course) => {
                            const average = calculateCourseAverage(course, gpaScale);
                            const projectedGrade = average !== null
                              ? percentToLetter(average, gradeScale)
                              : null;

                            return (
                              <tr key={course.id} className="border-b">
                                <td className="p-2 font-medium">{course.code}</td>
                                <td className="p-2">{course.name}</td>
                                <td className="p-2 text-center">{course.credits}</td>
                                <td className="p-2 text-center">
                                  {average !== null ? `${average.toFixed(1)}%` : 'N/A'}
                                  {projectedGrade && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({projectedGrade})
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  <Badge variant="secondary">In Progress</Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {confirmedCourses.length === 0 && inProgressCourses.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No courses in this semester
                  </p>
                )}

                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <span className="font-medium">Semester Total:</span>
                  <span className="font-medium">{semesterData.credits} credits</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Grade Scale ({gpaScale})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {gradeScale.ranges.map((range) => (
              <div key={range.letter} className="text-sm">
                <span className="font-bold">{range.letter}:</span> {range.min}-{range.max}% ={' '}
                {range.points.toFixed(1)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}