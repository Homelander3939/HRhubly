import React from 'react';
import { ScrumMasterInteractionMap } from './ScrumMasterInteractionMap';

/**
 * Standalone page for displaying the Scrum Master Interaction Map
 * This can be accessed to view and potentially export the diagram
 */
export const ScrumMasterDiagramPage: React.FC = () => {
  const handleDownloadSVG = () => {
    const svg = document.querySelector('#scrum-master-svg svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'scrum-master-interaction-map.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handleDownloadPNG = async () => {
    const svg = document.querySelector('#scrum-master-svg svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set high resolution for quality
    canvas.width = 3200; // 2x resolution
    canvas.height = 1800;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = 'scrum-master-interaction-map.png';
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
            სკრამ მასტერის ინტერაქციის რუკა
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            5 გუნდიანი სტრუქტურა - Hub პრინციპი
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
          id="scrum-master-svg" 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        >
          <ScrumMasterInteractionMap />
        </div>

        {/* Description */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            დიაგრამის განმარტება
          </h2>
          
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-bold text-lg mb-2">1. ცენტრი: SCRUM MASTER</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>ფასილიტატორი: წარმართავს მოვლენებს და უზრუნველყოფს ეფექტურ კომუნიკაციას</li>
                <li>მწვრთნელი (Coach): ასწავლი სკრამის პრინციპებს ყველა როლს</li>
                <li>ფარი: იცავს გუნდს გარე ხელისშემშლელი ფაქტორებისგან</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">2. ინტერაქცია: SM ↔️ PRODUCT OWNERS</h3>
              <p className="italic mb-2">ფოკუსი: პროცესის ხარისხი და მზაობა</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>DoR (Definition of Ready) დაცვა</li>
                <li>ეფექტური Backlog Management</li>
                <li>Dependencies მართვა 5 გუნდს შორის</li>
                <li>Velocity ანალიზი რეალისტური პროგნოზებისთვის</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">3. ინტერაქცია: SM ↔️ DEVELOPMENT TEAMS</h3>
              <p className="italic mb-2">ფოკუსი: ეფექტურობა და გუნდის ჯანმრთელობა</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Impediment Removal: ბლოკერების აქტიური მოხსნა</li>
                <li>შეფასების ფასილიტაცია: Story Points გუნდურად</li>
                <li>Burndown მონიტორინგი და რისკების შეტყობინება</li>
                <li>Team Happiness: მოტივაცია და რეტროსპექტივები</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">4. ინტერაქცია: SM ↔️ STAKEHOLDERS</h3>
              <p className="italic mb-2">ფოკუსი: მოლოდინების მართვა და განათლება</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Agile განათლება: ცვალებადი Scope-ის უპირატესობები</li>
                <li>რეალური მონაცემები (არა დაპირებები)</li>
                <li>გუნდის დაცვა სპრინტის შუა-გზაზე ცვლილებებისგან</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">5. გადაკვეთის ზონა: SM + POs + STAKEHOLDERS</h3>
              <p className="italic mb-2">ფოკუსი: გამჭვირვალობა და სტრატეგიული თანხვედრა</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Sprint Review (Demo) ფასილიტაცია კონსტრუქციული უკუკავშირით</li>
                <li>QBR (კვარტალური შეხვედრები): დიდი სურათი და Roadmap</li>
                <li>Roadmap Alignment: ბიზნეს მიზნების და პროდუქტის თანხვედრა</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrumMasterDiagramPage;
