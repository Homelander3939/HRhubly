import React from 'react';
import { AgileProcessMap } from './AgileProcessMap';

/**
 * Standalone page for displaying the Agile Process Map
 * Shows a 5-phase Scrum/Agile process visualization with export capabilities
 */
export const AgileProcessDiagramPage: React.FC = () => {
  const handleDownloadSVG = () => {
    const svg = document.querySelector('#agile-process-svg svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'agile-process-map.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handleDownloadPNG = async () => {
    const svg = document.querySelector('#agile-process-svg svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 3200;
    canvas.height = 4800;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = 'agile-process-map.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    };

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Agile პროცესის სრული რუკა
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            5 ფაზიანი სტრუქტურა — BRD-ზე დაფუძნებული სამუშაო პროცესი
          </p>
          
          {/* Download buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleDownloadSVG}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
            >
              📥 Download SVG (Vector)
            </button>
            <button
              onClick={handleDownloadPNG}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
            >
              📥 Download PNG (High Quality)
            </button>
          </div>
        </div>

        {/* Diagram */}
        <div 
          id="agile-process-svg" 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        >
          <AgileProcessMap />
        </div>

        {/* Description */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ფაზების განმარტება
          </h2>
          
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">
                ფაზა 1: გუნდის ფორმირება და ადაპტაცია (Hiring &amp; Onboarding)
              </h3>
              <p className="mb-2 italic text-sm text-gray-500">
                სანამ პროცესს დავიწყებთ, გვჭირდება ხალხი, ვინც ამ პროცესს „სულს შთაბერავს".
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>PO-ების გასაუბრება და შერჩევა — Agile აზროვნების და 5-გუნდიანი მასშტაბის შეფასება</li>
                <li>ორგანიზაციული სტრუქტურის გაცნობა — იერარქია, გუნდებს შორის კავშირები</li>
                <li>ონბორდინგი — შიდა კულტურა, კომუნიკაციის არხები, მოლოდინები</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 text-emerald-600 dark:text-emerald-400">
                ფაზა 2: ხარისხის ჩარჩოს შექმნა (Defining the Standards)
              </h3>
              <p className="mb-2 italic text-sm text-gray-500">
                აქ ვადგენთ „თამაშის წესებს" BRD დოკუმენტის საფუძველზე.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>BRD-ის ანალიზი — ბიზნეს მოთხოვნების გარდაქმნა ტექნიკურ დავალებებად</li>
                <li>DoR (Definition of Ready) — თასქის მზაობის კრიტერიუმები</li>
                <li>DoD (Definition of Done) — ხარისხის საერთო ნიშნული 5-ივე გუნდისთვის</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">
                ფაზა 3: ტაქტიკური დაგეგმარება და ინტეგრაცია (The Engine)
              </h3>
              <p className="mb-2 italic text-sm text-gray-500">
                ეს არის პროცესის „გული", სადაც ხდება დაგეგმარება და დამოკიდებულებების მართვა.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Backlog Refinement — BRD-ის მოთხოვნების დაშლა User Story-ებად</li>
                <li>Scrum of Scrums (SoS) — 5-ივე PO და ანალიტიკოსების კოორდინაცია</li>
                <li>Dependency Management — დეფენდენსების განსაზღვრა და „დაზღვევა"</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 text-violet-600 dark:text-violet-400">
                ფაზა 4: ციკლის დასრულება და ანალიტიკა (Delivery &amp; Feedback)
              </h3>
              <p className="mb-2 italic text-sm text-gray-500">
                სპრინტის დასრულების შემდეგ ვაჯამებთ შედეგებს.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Sprint Review — 5-ივე გუნდის ინტეგრირებული დემო, BRD-თან შესაბამისობის შემოწმება</li>
                <li>ანგარიშის მომზადება — Velocity, Burndown, ხარისხის მეტრიკები სტეიქჰოლდერებისთვის</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 text-red-600 dark:text-red-400">
                ფაზა 5: სტრატეგიული შედეგები და KPI-ების ეკოსისტემა
              </h3>
              <p className="mb-2 italic text-sm text-gray-500">
                ციფრებით ვადასტურებ, რომ სისტემა მუშაობს და ყველა მხარე მიზნებს აღწევს.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>დედლაინების შესრულება — სწორი შეფასების და სამუშაო პროცესის ხარჯზე</li>
                <li>სპრინტის სტაბილურობა — დაგეგმილ სპრინტში მინიმალური ჩარევა</li>
                <li>Velocity-ის სტაბილური ზრდა — ყველა გუნდის ჭრილში ეტაპობრივად</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgileProcessDiagramPage;
