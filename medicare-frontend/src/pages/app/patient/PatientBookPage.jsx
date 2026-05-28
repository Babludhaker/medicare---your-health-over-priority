import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/Dashboard';
import BookingFlow from '@/features/appointments/BookingFlow';
import { notify } from '@/store/ui.store';

/**
 * PatientBookPage — lets a patient book an appointment for themselves.
 *
 * BookingFlow is used without a `patientId`, so the backend books for
 * the authenticated patient. On success we route to the appointments
 * list.
 */
export default function PatientBookPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book a Visit"
        subtitle="Find a doctor and choose a time that works for you."
      />

      <Card>
        <CardBody>
          <BookingFlow
            onBooked={() => {
              notify.success('Your appointment is confirmed.');
              navigate('/app/appointments');
            }}
          />
        </CardBody>
      </Card>

      <div className="flex items-center gap-2 text-sm text-paper-500">
        <CheckCircle2 className="h-4 w-4 text-pine-500" />
        You'll get a reminder before your appointment.
      </div>
    </div>
  );
}
