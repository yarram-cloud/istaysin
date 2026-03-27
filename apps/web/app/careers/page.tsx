import LegalLayout from '../../components/LegalLayout';
import { Briefcase, Mail } from 'lucide-react';

export const metadata = {
  title: 'Careers | istaysin',
  description: 'Join the istaysin team and help build the future of Indian hospitality technology.',
};

export default function CareersPage() {
  return (
    <LegalLayout title="Careers at istaysin" description="Help us build the modern operating system for Indian hospitality.">

      <div className="space-y-8 text-sm text-surface-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">Why istaysin?</h2>
          <p>
            We are a small, fast-moving team solving a real problem for millions of hospitality 
            businesses in India. You will work on a product that property owners use every single day 
            to run their business. Every feature you ship has a direct, tangible impact.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">What We Offer</h2>
          <ul className="space-y-2 text-surface-600">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> Remote-first culture with flexible hours</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> Competitive salary with equity options</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> Health insurance for you and your family</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> Learning budget for conferences and courses</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> Direct impact on a product used by thousands</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-4">Open Positions</h2>

          <div className="space-y-3">
            {[
              { title: 'Full-Stack Developer', type: 'Engineering', location: 'Remote (India)', experience: '2-5 years' },
              { title: 'Product Designer', type: 'Design', location: 'Remote (India)', experience: '2-4 years' },
              { title: 'Customer Success Manager', type: 'Operations', location: 'Hyderabad', experience: '1-3 years' },
            ].map((job) => (
              <div key={job.title} className="border border-surface-200 rounded-xl p-4 hover:border-primary-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-surface-800">{job.title}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {job.type} &bull; {job.location} &bull; {job.experience}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">Open</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-surface-200 pt-8">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-surface-800">Don&apos;t see your role?</h2>
          </div>
          <p>
            We are always looking for talented people. Send your resume and a short note about 
            what excites you to{' '}
            <a href="mailto:careers@istaysin.com" className="text-primary-600 hover:underline">careers@istaysin.com</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
