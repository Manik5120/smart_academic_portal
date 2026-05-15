import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { SubjectCard } from '../../components/faculty/SubjectCard';
import { facultyAssignmentService } from '../../services/facultyAssignment';
import { facultyAvailabilityService } from '../../services/facultyAvailability';

export default function FacultySubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await facultyAssignmentService.getMySubjects();
      const processedData = data.map(assignment => ({
        ...assignment,
        available_slots: (assignment.available_slots || []).map(slot =>
          typeof slot === 'object' ? `${slot.day.charAt(0)}${slot.day.slice(1).toLowerCase()}-${slot.slot}` : slot
        )
      }));
      setSubjects(processedData);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSaveAvailability = useCallback(async (subjectId, semester, section, slots) => {
    try {
      if (slots === null) {
        return await facultyAvailabilityService.get(subjectId, semester, section);
      }

      await facultyAvailabilityService.update({
        subject_id: subjectId,
        semester,
        section,
        available_slots: slots,
      });

      return slots;
    } catch (err) {
      throw new Error(err.message || 'Failed to save availability');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#1266f1] mx-auto" />
          <p className="text-muted-foreground">Loading your subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Subjects</h1>
        <p className="text-muted-foreground">
          Manage your availability for assigned subjects
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-muted-foreground">No subjects assigned yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((assignment) => {
            const subjectId = assignment.subject?.id || assignment.subject?._id;

            return (
              <ErrorBoundary key={`${subjectId}-${assignment.semester}-${assignment.section}`}>
                <SubjectCard
                  subject={assignment.subject}
                  semester={assignment.semester}
                  section={assignment.section}
                  initialSlots={assignment.available_slots || []}
                  onSave={handleSaveAvailability}
                />
              </ErrorBoundary>
            );
          })}
        </div>
      )}
    </div>
  );
}
