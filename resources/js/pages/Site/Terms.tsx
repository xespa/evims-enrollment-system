import { Head } from '@inertiajs/react';
import TermsContent from '@/components/site/terms-content';

export default function Terms() {
    return (
        <>
            <Head title="Terms and Conditions" />

            <div className="bg-[#FBF8F2] px-4 py-12">
                <article className="mx-auto max-w-3xl rounded-3xl border border-[#1F2A24]/10 bg-white p-6 shadow-sm sm:p-10">
                    <span className="inline-flex rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Student Portal
                    </span>
                    <h1 className="mt-3 mb-6 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Terms and Conditions
                    </h1>
                    <TermsContent />
                </article>
            </div>
        </>
    );
}
