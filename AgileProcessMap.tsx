import React from 'react';

/**
 * Agile Process Map Component
 * Displays a comprehensive 5-phase Scrum/Agile process visualization
 * with Georgian text, corporate styling, charts and flow diagrams
 */
export const AgileProcessMap: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <svg
        width="1600"
        height="2400"
        viewBox="0 0 1600 2400"
        className="max-w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Phase gradients */}
          <linearGradient id="phase1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="phase2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="phase3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="phase4Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="phase5Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="timelineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="25%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          {/* Chart gradients */}
          <linearGradient id="barGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="burndownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
          </linearGradient>

          {/* Shadow filters */}
          <filter id="cardShadow" x="-3%" y="-3%" width="106%" height="112%">
            <feDropShadow dx="2" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
          </filter>
          <filter id="headerShadow" x="-2%" y="-5%" width="104%" height="115%">
            <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#1e293b" floodOpacity="0.2" />
          </filter>
          <filter id="circleShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="1600" height="2400" fill="#f8fafc" rx="0" />

        {/* Header Section */}
        <g id="header">
          <rect x="0" y="0" width="1600" height="140" fill="url(#headerGrad)" filter="url(#headerShadow)" />
          <text x="800" y="55" fontSize="34" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            Agile პროცესის სრული რუკა
          </text>
          <text x="800" y="85" fontSize="18" textAnchor="middle" fill="#94a3b8" fontFamily="system-ui, -apple-system, sans-serif">
            5 ფაზიანი სტრუქტურა — სკრამ მასტერის პერსპექტივა
          </text>
          <text x="800" y="115" fontSize="14" textAnchor="middle" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
            BRD-ზე დაფუძნებული სამუშაო პროცესი • 5 გუნდი • Scrum of Scrums
          </text>
        </g>

        {/* Timeline bar */}
        <rect x="95" y="180" width="8" height="2060" rx="4" fill="url(#timelineGrad)" opacity="0.3" />

        {/* ═══════════════════════════════════════════ */}
        {/* PHASE 1: Hiring & Onboarding */}
        {/* ═══════════════════════════════════════════ */}
        <g id="phase1">
          {/* Timeline node */}
          <circle cx="99" cy="280" r="20" fill="url(#phase1Grad)" filter="url(#circleShadow)" />
          <text x="99" y="286" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">1</text>

          {/* Card */}
          <rect x="150" y="180" width="1400" height="380" rx="16" fill="white" filter="url(#cardShadow)" />
          {/* Card header stripe */}
          <rect x="150" y="180" width="1400" height="60" rx="16" fill="url(#phase1Grad)" />
          <rect x="150" y="220" width="1400" height="20" fill="url(#phase1Grad)" />

          <text x="180" y="218" fontSize="22" fontWeight="bold" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ფაზა 1: გუნდის ფორმირება და ადაპტაცია
          </text>
          <text x="1520" y="218" fontSize="16" fontWeight="bold" fill="#bfdbfe" textAnchor="end" fontFamily="system-ui, -apple-system, sans-serif">
            Hiring &amp; Onboarding
          </text>

          {/* Subtitle */}
          <text x="180" y="270" fontSize="14" fontStyle="italic" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
            სანამ პროცესს დავიწყებთ, გვჭირდება ხალხი, ვინც ამ პროცესს „სულს შთაბერავს".
          </text>

          {/* Content columns */}
          {/* Left column - Process steps */}
          <g>
            <rect x="180" y="295" width="10" height="10" rx="2" fill="#3b82f6" />
            <text x="200" y="305" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              PO-ების გასაუბრება და შერჩევა
            </text>
            <text x="200" y="325" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ვმონაწილეობ ინტერვიუებში, რათა შევაფასო კანდიდატის Agile აზროვნება
            </text>
            <text x="200" y="343" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              და მათი უნარი, მართონ 5-გუნდიანი მასშტაბის სირთულეები.
            </text>

            <rect x="180" y="370" width="10" height="10" rx="2" fill="#3b82f6" />
            <text x="200" y="380" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              ორგანიზაციული სტრუქტურის გაცნობა
            </text>
            <text x="200" y="400" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              აყვანილ PO-ებს ვაცნობ კომპანიის იერარქიას, გუნდებს შორის კავშირებს
            </text>
            <text x="200" y="418" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              და იმ 5-გუნდიან მოდელს, რომელშიც მოუწევთ მუშაობა.
            </text>

            <rect x="180" y="445" width="10" height="10" rx="2" fill="#3b82f6" />
            <text x="200" y="455" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              ონბორდინგი
            </text>
            <text x="200" y="475" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ვუხსნი მათ შიდა კულტურას, კომუნიკაციის არხებს და იმ მოლოდინებს,
            </text>
            <text x="200" y="493" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              რაც სკრამ მასტერს აქვს მათ მიმართ.
            </text>
          </g>

          {/* Right mini-visual: Onboarding funnel */}
          <g transform="translate(1150, 280)">
            <text x="120" y="15" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              ონბორდინგის ნაკადი
            </text>
            {/* Funnel steps */}
            <rect x="20" y="35" width="200" height="35" rx="6" fill="#3b82f6" opacity="0.9" />
            <text x="120" y="58" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">კანდიდატების შერჩევა</text>

            <polygon points="55,75 185,75 175,80 65,80" fill="#3b82f6" opacity="0.3" />

            <rect x="40" y="82" width="160" height="35" rx="6" fill="#2563eb" opacity="0.9" />
            <text x="120" y="105" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">Agile შეფასება</text>

            <polygon points="70,122 170,122 162,127 78,127" fill="#2563eb" opacity="0.3" />

            <rect x="55" y="129" width="130" height="35" rx="6" fill="#1d4ed8" opacity="0.9" />
            <text x="120" y="152" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">სტრუქტურის გაცნობა</text>

            <polygon points="80,169 160,169 155,174 85,174" fill="#1d4ed8" opacity="0.3" />

            <rect x="65" y="176" width="110" height="35" rx="6" fill="#1e40af" opacity="0.9" />
            <text x="120" y="199" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">ონბორდინგი ✓</text>
          </g>
        </g>

        {/* Arrow connector 1→2 */}
        <line x1="99" y1="300" x2="99" y2="660" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8,4" opacity="0.4" />

        {/* ═══════════════════════════════════════════ */}
        {/* PHASE 2: Defining the Standards */}
        {/* ═══════════════════════════════════════════ */}
        <g id="phase2">
          <circle cx="99" cy="680" r="20" fill="url(#phase2Grad)" filter="url(#circleShadow)" />
          <text x="99" y="686" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">2</text>

          <rect x="150" y="590" width="1400" height="380" rx="16" fill="white" filter="url(#cardShadow)" />
          <rect x="150" y="590" width="1400" height="60" rx="16" fill="url(#phase2Grad)" />
          <rect x="150" y="630" width="1400" height="20" fill="url(#phase2Grad)" />

          <text x="180" y="628" fontSize="22" fontWeight="bold" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ფაზა 2: ხარისხის ჩარჩოს შექმნა
          </text>
          <text x="1520" y="628" fontSize="16" fontWeight="bold" fill="#a7f3d0" textAnchor="end" fontFamily="system-ui, -apple-system, sans-serif">
            Defining the Standards
          </text>

          <text x="180" y="680" fontSize="14" fontStyle="italic" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
            აქ ვადგენთ „თამაშის წესებს" BRD (Business Requirements Document) დოკუმენტის საფუძველზე.
          </text>

          {/* BRD Analysis */}
          <g>
            <rect x="180" y="705" width="10" height="10" rx="2" fill="#10b981" />
            <text x="200" y="715" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              BRD-ის ანალიზი
            </text>
            <text x="200" y="735" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              PO-ებთან ერთად განვიხილავთ ბიზნეს მოთხოვნების დოკუმენტს,
            </text>
            <text x="200" y="753" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              რათა ის გარდავქმნათ ტექნიკურ დავალებებად.
            </text>

            <rect x="180" y="778" width="10" height="10" rx="2" fill="#10b981" />
            <text x="200" y="788" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              DoR (Definition of Ready) და DoD (Definition of Done)
            </text>
            <text x="200" y="808" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ვიყენებთ BRD-ს, როგორც საფუძველს იმის განსასაზღვრად, თუ რა დონის
            </text>
            <text x="200" y="826" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              დეტალიზაცია სჭირდება თასქს, რომ ის Ready (მზად) იყოს სპრინტისთვის.
            </text>

            <rect x="180" y="851" width="10" height="10" rx="2" fill="#10b981" />
            <text x="200" y="861" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              ხარისხის საერთო ნიშნული (Done)
            </text>
            <text x="200" y="881" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ვადგენთ ხარისხის საერთო ნიშნულს, რათა 5-ივე გუნდმა იცოდეს,
            </text>
            <text x="200" y="899" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              როდის ითვლება საქმე დასრულებულად.
            </text>
          </g>

          {/* Right mini-visual: DoR/DoD diagram */}
          <g transform="translate(1100, 680)">
            <text x="180" y="15" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              ხარისხის ჩარჩო
            </text>
            {/* BRD Box */}
            <rect x="110" y="30" width="140" height="40" rx="8" fill="#059669" opacity="0.15" stroke="#059669" strokeWidth="2" />
            <text x="180" y="55" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#059669" fontFamily="system-ui, -apple-system, sans-serif">BRD დოკუმენტი</text>
            {/* Arrow down */}
            <line x1="180" y1="72" x2="180" y2="90" stroke="#059669" strokeWidth="2" />
            <polygon points="175,88 185,88 180,96" fill="#059669" />
            {/* DoR Box */}
            <rect x="50" y="100" width="120" height="40" rx="8" fill="#10b981" />
            <text x="110" y="125" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">DoR (Ready)</text>
            {/* DoD Box */}
            <rect x="190" y="100" width="120" height="40" rx="8" fill="#10b981" />
            <text x="250" y="125" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">DoD (Done)</text>
            {/* Arrows down from DoR/DoD */}
            <line x1="110" y1="142" x2="110" y2="160" stroke="#10b981" strokeWidth="2" />
            <line x1="250" y1="142" x2="250" y2="160" stroke="#10b981" strokeWidth="2" />
            {/* 5 teams row */}
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={`team-std-${i}`}>
                <rect x={50 + i * 56} y={165} width={50} height={28} rx={5} fill="#059669" opacity={0.8} />
                <text x={75 + i * 56} y={183} fontSize="10" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
                  გუნდი {i + 1}
                </text>
              </g>
            ))}
            <text x="180" y="215" fontSize="11" textAnchor="middle" fill="#059669" fontFamily="system-ui, -apple-system, sans-serif">
              ერთიანი სტანდარტი 5-ივე გუნდისთვის
            </text>
          </g>
        </g>

        {/* Arrow connector 2→3 */}
        <line x1="99" y1="700" x2="99" y2="1070" stroke="#10b981" strokeWidth="3" strokeDasharray="8,4" opacity="0.4" />

        {/* ═══════════════════════════════════════════ */}
        {/* PHASE 3: The Engine */}
        {/* ═══════════════════════════════════════════ */}
        <g id="phase3">
          <circle cx="99" cy="1090" r="20" fill="url(#phase3Grad)" filter="url(#circleShadow)" />
          <text x="99" y="1096" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">3</text>

          <rect x="150" y="1000" width="1400" height="440" rx="16" fill="white" filter="url(#cardShadow)" />
          <rect x="150" y="1000" width="1400" height="60" rx="16" fill="url(#phase3Grad)" />
          <rect x="150" y="1040" width="1400" height="20" fill="url(#phase3Grad)" />

          <text x="180" y="1038" fontSize="22" fontWeight="bold" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ფაზა 3: ტაქტიკური დაგეგმარება და ინტეგრაცია
          </text>
          <text x="1520" y="1038" fontSize="16" fontWeight="bold" fill="#fef3c7" textAnchor="end" fontFamily="system-ui, -apple-system, sans-serif">
            The Engine
          </text>

          {/* Engine badge */}
          <rect x="180" y="1075" width="100" height="26" rx="13" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="230" y="1093" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#d97706" fontFamily="system-ui, -apple-system, sans-serif">⚙ პროცესის გული</text>

          <text x="300" y="1093" fontSize="14" fontStyle="italic" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
            სადაც ხდება დაგეგმარება და დამოკიდებულებების მართვა
          </text>

          {/* Backlog Refinement */}
          <g>
            <rect x="180" y="1115" width="10" height="10" rx="2" fill="#f59e0b" />
            <text x="200" y="1125" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              Backlog Refinement (BRD-ის მიხედვით)
            </text>
            <text x="200" y="1145" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ვფასილიტირებ შეხვედრებს, სადაც PO-ები და ანალიტიკოსები BRD-ის მოთხოვნებს
            </text>
            <text x="200" y="1163" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              „შლიან" პატარა, გასაგებ User Story-ებად.
            </text>
          </g>

          {/* Scrum of Scrums */}
          <g>
            <rect x="180" y="1188" width="10" height="10" rx="2" fill="#f59e0b" />
            <text x="200" y="1198" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              Scrum of Scrums (SoS) &amp; Dependency Management
            </text>
            <rect x="200" y="1210" width="160" height="22" rx="11" fill="#ef4444" opacity="0.1" stroke="#ef4444" strokeWidth="1" />
            <text x="280" y="1226" fontSize="11" fontWeight="bold" fill="#ef4444" fontFamily="system-ui, -apple-system, sans-serif">
              კრიტიკული წერტილი
            </text>

            <text x="200" y="1252" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ვიკრიბებით მე, 5-ივე PO და ანალიტიკოსები.
            </text>

            <rect x="220" y="1268" width="8" height="8" rx="1" fill="#d97706" />
            <text x="236" y="1277" fontSize="13" fontWeight="600" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              დეფენდენსების განსაზღვრა: ვადგენთ, რომელი გუნდის დავალებაა დამოკიდებული მეორეზე.
            </text>

            <rect x="220" y="1295" width="8" height="8" rx="1" fill="#d97706" />
            <text x="236" y="1304" fontSize="13" fontWeight="600" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              გადაწყვეტილების მიღება: ერთობლივად ვწყვეტთ, რა შევიტანოთ სპრინტში,
            </text>
            <text x="236" y="1322" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              რომ ერთმანეთის დეფენდენსები „დავაზღვიოთ" და გუნდები არ გაჩერდნენ.
            </text>
          </g>

          {/* Right mini-visual: Dependency matrix */}
          <g transform="translate(1050, 1075)">
            <text x="220" y="15" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              დეფენდენსების მატრიცა
            </text>

            {/* SoS hub diagram */}
            {/* Center - SM */}
            <circle cx="220" cy="130" r="28" fill="url(#phase3Grad)" />
            <text x="220" y="126" fontSize="9" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">SCRUM</text>
            <text x="220" y="139" fontSize="9" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">MASTER</text>

            {/* Surrounding PO nodes */}
            {[
              { x: 220, y: 50, label: 'PO 1' },
              { x: 320, y: 90, label: 'PO 2' },
              { x: 310, y: 180, label: 'PO 3' },
              { x: 130, y: 180, label: 'PO 4' },
              { x: 120, y: 90, label: 'PO 5' },
            ].map((po, i) => (
              <g key={`po-node-${i}`}>
                <line x1="220" y1="130" x2={po.x} y2={po.y} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,3" />
                <circle cx={po.x} cy={po.y} r="20" fill="#f59e0b" opacity="0.9" />
                <text x={po.x} y={po.y + 4} fontSize="10" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">{po.label}</text>
              </g>
            ))}

            {/* Dependency arrows between POs */}
            <line x1="240" y1="52" x2="300" y2="78" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
            <line x1="300" y1="98" x2="298" y2="168" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
            <line x1="142" y1="172" x2="200" y2="55" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />

            <text x="220" y="225" fontSize="11" textAnchor="middle" fill="#d97706" fontFamily="system-ui, -apple-system, sans-serif">
              SoS: ცენტრალიზებული კოორდინაცია
            </text>
            <text x="370" y="140" fontSize="10" fill="#ef4444" fontFamily="system-ui, -apple-system, sans-serif">deps</text>
          </g>
        </g>

        {/* Arrow connector 3→4 */}
        <line x1="99" y1="1110" x2="99" y2="1530" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,4" opacity="0.4" />

        {/* ═══════════════════════════════════════════ */}
        {/* PHASE 4: Delivery & Feedback */}
        {/* ═══════════════════════════════════════════ */}
        <g id="phase4">
          <circle cx="99" cy="1550" r="20" fill="url(#phase4Grad)" filter="url(#circleShadow)" />
          <text x="99" y="1556" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">4</text>

          <rect x="150" y="1470" width="1400" height="380" rx="16" fill="white" filter="url(#cardShadow)" />
          <rect x="150" y="1470" width="1400" height="60" rx="16" fill="url(#phase4Grad)" />
          <rect x="150" y="1510" width="1400" height="20" fill="url(#phase4Grad)" />

          <text x="180" y="1508" fontSize="22" fontWeight="bold" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ფაზა 4: ციკლის დასრულება და ანალიტიკა
          </text>
          <text x="1520" y="1508" fontSize="16" fontWeight="bold" fill="#ddd6fe" textAnchor="end" fontFamily="system-ui, -apple-system, sans-serif">
            Delivery &amp; Feedback
          </text>

          <text x="180" y="1555" fontSize="14" fontStyle="italic" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
            სპრინტის დასრულების შემდეგ ვაჯამებთ შედეგებს.
          </text>

          {/* Sprint Review */}
          <g>
            <rect x="180" y="1575" width="10" height="10" rx="2" fill="#8b5cf6" />
            <text x="200" y="1585" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              Sprint Review (ინტეგრირებული დემო)
            </text>
            <text x="200" y="1605" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              5-ივე გუნდი წარადგენს ნამუშევარს. აქ ვამოწმებთ, რამდენად პასუხობს
            </text>
            <text x="200" y="1623" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              შესრულებული სამუშაო საწყის BRD-ს.
            </text>
          </g>

          {/* Report */}
          <g>
            <rect x="180" y="1648" width="10" height="10" rx="2" fill="#8b5cf6" />
            <text x="200" y="1658" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              ანგარიშის მომზადება
            </text>
            <text x="200" y="1678" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ვამზადებ დეტალურ რეპორტს (Velocity, Burndown, ხარისხის მეტრიკები),
            </text>
            <text x="200" y="1696" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              რომელსაც წარვუდგენთ სტეიქჰოლდერებს შემდეგი სტრატეგიული ნაბიჯების დასაგეგმად.
            </text>
          </g>

          {/* Right mini-visual: Burndown & Velocity charts */}
          <g transform="translate(1050, 1545)">
            <text x="200" y="15" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              სპრინტის მეტრიკები
            </text>

            {/* Burndown chart */}
            <text x="10" y="40" fontSize="11" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">Burndown Chart</text>
            <rect x="10" y="48" width="180" height="100" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            {/* Ideal line */}
            <line x1="20" y1="58" x2="180" y2="138" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
            {/* Actual burndown line */}
            <polyline
              points="20,58 45,65 70,78 95,82 120,100 145,118 170,135"
              fill="none" stroke="#8b5cf6" strokeWidth="2.5"
            />
            <circle cx="170" cy="135" r="3" fill="#8b5cf6" />
            {/* Area fill */}
            <polygon
              points="20,58 45,65 70,78 95,82 120,100 145,118 170,135 170,138 20,138"
              fill="url(#burndownGrad)"
            />
            <text x="95" y="155" fontSize="9" textAnchor="middle" fill="#94a3b8" fontFamily="system-ui, -apple-system, sans-serif">სპრინტის დღეები</text>

            {/* Velocity chart */}
            <text x="220" y="40" fontSize="11" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">Velocity (Story Points)</text>
            <rect x="220" y="48" width="180" height="100" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            {/* Velocity bars */}
            {[
              { h: 50, label: 'S1' },
              { h: 58, label: 'S2' },
              { h: 52, label: 'S3' },
              { h: 65, label: 'S4' },
              { h: 72, label: 'S5' },
              { h: 78, label: 'S6' },
            ].map((bar, i) => (
              <g key={`vel-bar-${i}`}>
                <rect
                  x={234 + i * 26}
                  y={148 - bar.h}
                  width={18}
                  height={bar.h}
                  rx={3}
                  fill="url(#barGrad1)"
                  opacity={0.8}
                />
                <text x={243 + i * 26} y={155} fontSize="8" textAnchor="middle" fill="#94a3b8" fontFamily="system-ui, -apple-system, sans-serif">{bar.label}</text>
              </g>
            ))}
            {/* Trend line */}
            <line x1="243" y1="108" x2="373" y2="78" stroke="#1d4ed8" strokeWidth="1.5" strokeDasharray="3,2" />

            {/* BRD compliance indicator */}
            <text x="200" y="190" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#059669" fontFamily="system-ui, -apple-system, sans-serif">
              BRD შესაბამისობა: 94%
            </text>
            <rect x="100" y="198" width="200" height="8" rx="4" fill="#e2e8f0" />
            <rect x="100" y="198" width="188" height="8" rx="4" fill="#10b981" />

            <text x="200" y="225" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#8b5cf6" fontFamily="system-ui, -apple-system, sans-serif">
              Sprint Velocity: ზრდის ტრენდი ↑
            </text>
          </g>
        </g>

        {/* Arrow connector 4→5 */}
        <line x1="99" y1="1570" x2="99" y2="1940" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="8,4" opacity="0.4" />

        {/* ═══════════════════════════════════════════ */}
        {/* PHASE 5: KPI Ecosystem */}
        {/* ═══════════════════════════════════════════ */}
        <g id="phase5">
          <circle cx="99" cy="1960" r="20" fill="url(#phase5Grad)" filter="url(#circleShadow)" />
          <text x="99" y="1966" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif">5</text>

          <rect x="150" y="1880" width="1400" height="440" rx="16" fill="white" filter="url(#cardShadow)" />
          <rect x="150" y="1880" width="1400" height="60" rx="16" fill="url(#phase5Grad)" />
          <rect x="150" y="1920" width="1400" height="20" fill="url(#phase5Grad)" />

          <text x="180" y="1918" fontSize="22" fontWeight="bold" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ფაზა 5: სტრატეგიული შედეგები და KPI-ების ეკოსისტემა
          </text>
          <text x="1520" y="1918" fontSize="16" fontWeight="bold" fill="#fecaca" textAnchor="end" fontFamily="system-ui, -apple-system, sans-serif">
            Strategic KPIs
          </text>

          <text x="180" y="1965" fontSize="14" fontStyle="italic" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
            ციფრებით ვადასტურებ, რომ სისტემა მუშაობს და ყველა მხარე მიზნებს აღწევს.
          </text>

          {/* KPI descriptions */}
          <g>
            <rect x="180" y="1988" width="10" height="10" rx="2" fill="#ef4444" />
            <text x="200" y="1998" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              დედლაინების შესრულება
            </text>
            <text x="200" y="2018" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              აღებული პროექტების დედლაინში შესრულება სწორი შეფასების
            </text>
            <text x="200" y="2036" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              და სწორი სამუშაო პროცესის ხარჯზე.
            </text>

            <rect x="180" y="2058" width="10" height="10" rx="2" fill="#ef4444" />
            <text x="200" y="2068" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              სპრინტის სტაბილურობა
            </text>
            <text x="200" y="2088" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              დაგეგმილ სპრინტში აღარ ეშლება გუნდს ხელი —
            </text>
            <text x="200" y="2106" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              მინიმალური ჩარევა გარე ფაქტორებისგან.
            </text>

            <rect x="180" y="2128" width="10" height="10" rx="2" fill="#ef4444" />
            <text x="200" y="2138" fontSize="15" fontWeight="bold" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              Velocity-ის სტაბილური ზრდა
            </text>
            <text x="200" y="2158" fontSize="13" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">
              ყველა გუნდის ჭრილში, ეტაპობრივი ზრდა რამდენადაც შესაძლებელია.
            </text>
          </g>

          {/* Right mini-visual: KPI Dashboard */}
          <g transform="translate(1000, 1955)">
            <text x="270" y="15" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#1e293b" fontFamily="system-ui, -apple-system, sans-serif">
              KPI Dashboard
            </text>

            {/* KPI Cards */}
            {/* Deadline completion */}
            <rect x="30" y="30" width="150" height="80" rx="10" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
            <text x="105" y="55" fontSize="28" fontWeight="bold" textAnchor="middle" fill="#dc2626" fontFamily="system-ui, -apple-system, sans-serif">92%</text>
            <text x="105" y="75" fontSize="11" textAnchor="middle" fill="#991b1b" fontFamily="system-ui, -apple-system, sans-serif">დედლაინების</text>
            <text x="105" y="90" fontSize="11" textAnchor="middle" fill="#991b1b" fontFamily="system-ui, -apple-system, sans-serif">შესრულება</text>

            {/* Sprint stability */}
            <rect x="200" y="30" width="150" height="80" rx="10" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
            <text x="275" y="55" fontSize="28" fontWeight="bold" textAnchor="middle" fill="#16a34a" fontFamily="system-ui, -apple-system, sans-serif">87%</text>
            <text x="275" y="75" fontSize="11" textAnchor="middle" fill="#166534" fontFamily="system-ui, -apple-system, sans-serif">სპრინტის</text>
            <text x="275" y="90" fontSize="11" textAnchor="middle" fill="#166534" fontFamily="system-ui, -apple-system, sans-serif">სტაბილურობა</text>

            {/* Velocity growth */}
            <rect x="370" y="30" width="150" height="80" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
            <text x="445" y="55" fontSize="28" fontWeight="bold" textAnchor="middle" fill="#2563eb" fontFamily="system-ui, -apple-system, sans-serif">+15%</text>
            <text x="445" y="75" fontSize="11" textAnchor="middle" fill="#1e40af" fontFamily="system-ui, -apple-system, sans-serif">Velocity</text>
            <text x="445" y="90" fontSize="11" textAnchor="middle" fill="#1e40af" fontFamily="system-ui, -apple-system, sans-serif">ზრდა</text>

            {/* Team velocity comparison bar chart */}
            <text x="270" y="140" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
              Velocity გუნდების ჭრილში
            </text>
            <rect x="30" y="150" width="490" height="100" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

            {/* 5 team bars with labels */}
            {[
              { team: 'გუნდი 1', val: 68, color: '#3b82f6' },
              { team: 'გუნდი 2', val: 75, color: '#10b981' },
              { team: 'გუნდი 3', val: 60, color: '#f59e0b' },
              { team: 'გუნდი 4', val: 82, color: '#8b5cf6' },
              { team: 'გუნდი 5', val: 70, color: '#ef4444' },
            ].map((t, i) => (
              <g key={`team-vel-${i}`}>
                <text x={55} y={175 + i * 18} fontSize="10" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif">{t.team}</text>
                <rect x={120} y={166 + i * 18} width={t.val * 3.8} height={12} rx={3} fill={t.color} opacity={0.8} />
                <text x={128 + t.val * 3.8} y={176 + i * 18} fontSize="10" fontWeight="bold" fill={t.color} fontFamily="system-ui, -apple-system, sans-serif">{t.val} SP</text>
              </g>
            ))}

            {/* Growth arrows */}
            <text x="270" y="275" fontSize="11" textAnchor="middle" fill="#059669" fontWeight="bold" fontFamily="system-ui, -apple-system, sans-serif">
              ↑ ეტაპობრივი, სტაბილური ზრდა ყველა გუნდში
            </text>
          </g>
        </g>

        {/* Bottom legend / summary bar */}
        <g id="footer">
          <rect x="150" y="2345" width="1400" height="40" rx="10" fill="#1e293b" opacity="0.05" />
          <text x="800" y="2368" fontSize="13" textAnchor="middle" fill="#64748b" fontFamily="system-ui, -apple-system, sans-serif">
            Agile პროცესის 5 ფაზა • BRD-ზე დაფუძნებული • Scrum of Scrums • 5 გუნდი • სკრამ მასტერის პერსპექტივა
          </text>
        </g>
      </svg>
    </div>
  );
};

export default AgileProcessMap;
