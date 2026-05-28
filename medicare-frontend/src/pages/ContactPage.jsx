import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SectionHeading from '@/features/public/SectionHeading';
import { notify } from '@/store/ui.store';
import { sleep } from '@/lib/utils';

/**
 * ContactPage — contact details + an enquiry form.
 *
 * The backend has no public contact endpoint, so submission is handled
 * locally with a simulated delay. Wire this to a real endpoint (or an
 * email service) when one exists.
 */

const CONTACT_DETAILS = [
  {
    icon: Mail,
    label: 'Email us',
    value: 'hello@medicareconnect.app',
    note: 'We reply within one business day.',
  },
  {
    icon: Phone,
    label: 'Call us',
    value: '+91 731 000 0000',
    note: 'Mon–Fri, 9am to 6pm IST.',
  },
  {
    icon: MapPin,
    label: 'Visit us',
    value: 'Indore, Madhya Pradesh',
    note: '3rd Floor, Tech Park, Vijay Nagar.',
  },
  {
    icon: Clock,
    label: 'Support hours',
    value: 'Mon–Sat, 8am–8pm',
    note: 'Priority support on Pro and Enterprise.',
  },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    // Simulated submission — replace with a real API call later.
    await sleep(900);
    // eslint-disable-next-line no-console
    console.log('Contact enquiry:', values);
    setSent(true);
    reset();
    notify.success('Thanks — we’ll be in touch soon.');
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-dotted opacity-60" />
        <div className="container-page relative pb-14 pt-32 text-center sm:pt-40">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="eyebrow justify-center"
          >
            <span className="h-px w-6 bg-pine-400" />
            Get in touch
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-pine-900 sm:text-5xl"
          >
            We'd love to hear from you
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-4 max-w-xl text-lg text-paper-600"
          >
            Questions about the platform, pricing, or a demo for your
            clinic — send a note and a real person will reply.
          </motion.p>
        </div>
      </section>

      {/* Contact grid */}
      <section className="container-page py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Details */}
          <div>
            <SectionHeading
              eyebrow="Reach us"
              title="Contact details"
              align="left"
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {CONTACT_DETAILS.map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-paper-200 bg-paper-50 p-5"
                >
                  <div className="inline-flex rounded-xl bg-pine-100 p-2.5 text-pine-700">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-paper-500">
                    {c.label}
                  </p>
                  <p className="mt-1 font-semibold text-pine-900">
                    {c.value}
                  </p>
                  <p className="mt-0.5 text-sm text-paper-500">{c.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-paper-200 bg-paper-50 p-6 shadow-soft sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-2xl bg-emerald-100 p-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-pine-900">
                  Message sent
                </h3>
                <p className="mt-2 max-w-sm text-sm text-paper-600">
                  Thanks for reaching out. Our team will get back to you
                  within one business day.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSent(false)}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <h3 className="text-xl font-semibold text-pine-900">
                  Send us a message
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    required
                    placeholder="Asha Verma"
                    error={errors.name?.message}
                    {...register('name', {
                      required: 'Please enter your name',
                    })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    required
                    placeholder="you@clinic.com"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Please enter your email',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email',
                      },
                    })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Clinic / Organisation"
                    placeholder="Sunrise Clinic"
                    {...register('clinic')}
                  />
                  <Select
                    label="I'm interested in"
                    {...register('topic')}
                  >
                    <option value="general">General enquiry</option>
                    <option value="demo">Booking a demo</option>
                    <option value="pricing">Pricing & plans</option>
                    <option value="support">Support</option>
                    <option value="partnership">Partnership</option>
                  </Select>
                </div>
                <Textarea
                  label="Message"
                  required
                  rows={5}
                  placeholder="Tell us a little about your clinic and what you're looking for…"
                  error={errors.message?.message}
                  {...register('message', {
                    required: 'Please enter a message',
                    minLength: {
                      value: 10,
                      message: 'Message is a little short',
                    },
                  })}
                />
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  {!isSubmitting && <Send className="h-4 w-4" />}
                  Send message
                </Button>
                <p className="text-center text-xs text-paper-500">
                  By submitting you agree to our privacy policy.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
