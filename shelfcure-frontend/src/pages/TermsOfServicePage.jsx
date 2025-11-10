import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-primary-100">Please read these terms carefully before using ShelfCure.</p>
        </div>
      </section>

      {/* Last Updated */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="space-y-8 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                1. Acceptance of Terms
              </h3>
              <p>By accessing and using ShelfCure, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                2. Use License
              </h3>
              <p className="mb-3">Permission is granted to temporarily download one copy of the materials (information or software) on ShelfCure for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on ShelfCure</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary-600" />
                3. Disclaimer
              </h3>
              <p>The materials on ShelfCure are provided on an 'as is' basis. ShelfCure makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary-600" />
                4. Limitations
              </h3>
              <p>In no event shall ShelfCure or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ShelfCure, even if ShelfCure or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">5. Accuracy of Materials</h3>
              <p>The materials appearing on ShelfCure could include technical, typographical, or photographic errors. ShelfCure does not warrant that any of the materials on ShelfCure are accurate, complete, or current. ShelfCure may make changes to the materials contained on ShelfCure at any time without notice.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">6. Links</h3>
              <p>ShelfCure has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by ShelfCure of the site. Use of any such linked website is at the user's own risk.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">7. Modifications</h3>
              <p>ShelfCure may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">8. Governing Law</h3>
              <p>These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-2">Questions?</h3>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <p className="mt-2 font-semibold">legal@shelfcure.com</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;

