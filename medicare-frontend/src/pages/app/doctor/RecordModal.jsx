import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { ClipboardPlus, Pill, Plus, Trash2, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Card";
import { useResource, useMutation } from "@/hooks/useResource";
import { recordApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";
import { notify } from "@/store/ui.store";
import { errorMessage } from "@/lib/utils";

/**
 * RecordModal — the EMR editor for an appointment. Two tabs:
 *  - Visit notes (diagnosis, vitals, clinical notes)
 *  - Prescription (a list of medication lines)
 *
 * Loads any existing record/prescription so the doctor can review or
 * amend it.
 */
export default function RecordModal({ appointment, onClose, onSaved }) {
  const [tab, setTab] = useState("notes");

  const patient = appointment.patient || appointment.patientUser || {};
  const patientName =
    `${patient.firstName || patient.user?.firstName || ""} ${
      patient.lastName || patient.user?.lastName || ""
    }`.trim() || "Patient";

  // Load existing record + prescription, if any.
  const { data: record, loading: recordLoading } = useResource(
    qk.records.record(appointment.id),
    () => recordApi.getRecord(appointment.id).catch(() => null),
  );
  const { data: prescription, loading: rxLoading } = useResource(
    qk.records.prescription(appointment.id),
    () => recordApi.getPrescription(appointment.id).catch(() => null),
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Consultation record"
      description={`${patientName} · visit notes and prescription`}
      size="lg"
    >
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-paper-100 p-1">
        <TabButton
          active={tab === "notes"}
          onClick={() => setTab("notes")}
          icon={FileText}
          label="Visit notes"
        />
        <TabButton
          active={tab === "rx"}
          onClick={() => setTab("rx")}
          icon={Pill}
          label="Prescription"
        />
      </div>

      {tab === "notes" ? (
        recordLoading ? (
          <Loading />
        ) : (
          <NotesForm
            appointmentId={appointment.id}
            existing={record?.record || record}
            onSaved={onSaved}
          />
        )
      ) : rxLoading ? (
        <Loading />
      ) : (
        <PrescriptionForm
          appointmentId={appointment.id}
          existing={prescription?.prescription || prescription}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <Spinner />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors " +
        (active
          ? "bg-paper-50 text-pine-900 shadow-soft"
          : "text-paper-500 hover:text-pine-700")
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/**
 * NotesForm — diagnosis, vitals, and clinical notes for the visit.
 */
function NotesForm({ appointmentId, existing, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      diagnosis: existing?.diagnosis || "",
      symptoms: existing?.symptoms || "",
      bloodPressure: existing?.vitals?.bloodPressure || "",
      temperature: existing?.vitals?.temperature || "",
      pulse: existing?.vitals?.pulse || "",
      weight: existing?.vitals?.weight || "",
      notes: existing?.notes || existing?.clinicalNotes || "",
      followUp: existing?.followUpInstructions || "",
    },
  });

  const { mutate, loading } = useMutation(
    (body) => recordApi.createRecord(appointmentId, body),
    {
      invalidate: [qk.records.record(appointmentId), qk.appointments.all],
      onSuccess: () => {
        notify.success("Visit notes saved.");
        onSaved();
      },
      onError: (err) => notify.error(errorMessage(err)),
    },
  );

  const onSubmit = (values) => {
    mutate({
      diagnosis: values.diagnosis,
      symptoms: values.symptoms || undefined,
      vitals: {
        bloodPressure: values.bloodPressure || undefined,
        temperature: values.temperature || undefined,
        pulse: values.pulse || undefined,
        weight: values.weight || undefined,
      },
      notes: values.notes || undefined,
      followUpInstructions: values.followUp || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Diagnosis"
        required
        placeholder="Primary diagnosis"
        error={errors.diagnosis?.message}
        {...register("diagnosis", { required: "Diagnosis is required" })}
      />
      <Textarea
        label="Symptoms / presenting complaint"
        rows={2}
        placeholder="What the patient reported"
        {...register("symptoms")}
      />

      {/* Vitals */}
      <div>
        <p className="mb-2 text-sm font-medium text-paper-700">Vitals</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            label="BP"
            placeholder="120/80"
            {...register("bloodPressure")}
          />
          <Input
            label="Temp (°F)"
            placeholder="98.6"
            {...register("temperature")}
          />
          <Input label="Pulse" placeholder="72" {...register("pulse")} />
          <Input label="Weight (kg)" placeholder="68" {...register("weight")} />
        </div>
      </div>

      <Textarea
        label="Clinical notes"
        rows={3}
        placeholder="Examination findings, observations, advice"
        {...register("notes")}
      />
      <Textarea
        label="Follow-up instructions"
        rows={2}
        placeholder="When to return, what to watch for"
        {...register("followUp")}
      />

      <div className="flex justify-end gap-3 border-t border-paper-200 pt-4">
        <Button type="submit" loading={loading}>
          <ClipboardPlus className="h-4 w-4" />
          Save visit notes
        </Button>
      </div>
    </form>
  );
}

/**
 * PrescriptionForm — a dynamic list of medication lines.
 */
function PrescriptionForm({ appointmentId, existing, onSaved }) {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      medications:
        existing?.medications?.length > 0
          ? existing.medications
          : [{ name: "", dosage: "", frequency: "", duration: "" }],
      advice: existing?.advice || existing?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  const { mutate, loading } = useMutation(
    (body) => recordApi.createPrescription(appointmentId, body),
    {
      invalidate: [qk.records.prescription(appointmentId)],
      onSuccess: () => {
        notify.success("Prescription saved.");
        onSaved();
      },
      onError: (err) => notify.error(errorMessage(err)),
    },
  );

  const onSubmit = (values) => {
    const medications = values.medications.filter((m) => m.name?.trim());
    if (medications.length === 0) {
      notify.error("Add at least one medication.");
      return;
    }

    // ✅ Frontend keys → Backend keys map karo
    mutate({
      items: medications.map((m) => ({
        drugName: m.name,
        dosage: m.dosage || "",
        frequency: m.frequency || "",
        durationDays: parseInt(m.duration) || 1,
      })),
      advice: values.advice || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-xl border border-paper-200 bg-paper-100 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-paper-500">
                Medication {index + 1}
              </span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-md p-1 text-paper-400 hover:bg-clay-50 hover:text-clay-600"
                  aria-label="Remove medication"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Input
                placeholder="Medicine name"
                {...register(`medications.${index}.name`)}
              />
              <Input
                placeholder="Dosage (e.g. 500mg)"
                {...register(`medications.${index}.dosage`)}
              />
              <Input
                placeholder="Frequency (e.g. twice daily)"
                {...register(`medications.${index}.frequency`)}
              />
              <Input
                placeholder="Duration (e.g. 5 days)"
                {...register(`medications.${index}.duration`)}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({ name: "", dosage: "", frequency: "", duration: "" })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add medication
      </Button>

      <Textarea
        label="Additional advice"
        rows={2}
        placeholder="Dietary advice, precautions, etc."
        {...register("advice")}
      />

      <div className="flex justify-end gap-3 border-t border-paper-200 pt-4">
        <Button type="submit" loading={loading}>
          <Pill className="h-4 w-4" />
          Save prescription
        </Button>
      </div>
    </form>
  );
}
