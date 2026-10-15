import { Head } from '@inertiajs/react';
import TermsContent from '@/components/site/terms-content';

export default function Terms() {
    return (
        <>
            <Head title="Terms and Conditions" />

            <div className="bg-cream px-4 py-12">
                <article className="mx-auto max-w-3xl rounded-3xl border border-ink/10 bg-surface p-6 shadow-sm sm:p-10">
                    <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-ink uppercase">
                        Student Portal
                    </span>
                    <h1 className="mt-3 mb-6 font-serif text-3xl font-semibold text-ink">
                        Terms and Conditions
                    </h1>
                    <TermsContent />
                </article>
            </div>
        </>
    );
}
