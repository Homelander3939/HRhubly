import React from 'react';

/**
 * Scrum Master Interaction Map Component
 * Displays a hub-based diagram with Scrum Master at center
 * interacting with Product Owners, Development Teams, and Stakeholders
 */
export const ScrumMasterInteractionMap: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <svg
        width="1400"
        height="1000"
        viewBox="0 0 1400 1000"
        className="max-w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient definitions */}
          <linearGradient id="smGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="poGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="devGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="shGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="intersectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>

          {/* Arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
          </marker>
        </defs>

        {/* Title */}
        <text
          x="700"
          y="40"
          fontSize="32"
          fontWeight="bold"
          textAnchor="middle"
          fill="#1e293b"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          კრამ მასტერის ინტერაქციის რუკა
        </text>
        <text
          x="700"
          y="70"
          fontSize="20"
          textAnchor="middle"
          fill="#64748b"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          (5 გუნდიანი სტრუქტურა - Hub პრინციპი)
        </text>

        {/* Connection lines from SM to other entities */}
        {/* To POs */}
        <line x1="700" y1="500" x2="350" y2="280" stroke="#64748b" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
        <line x1="350" y1="280" x2="700" y2="500" stroke="#64748b" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
        
        {/* To Dev Teams */}
        <line x1="700" y1="500" x2="1050" y2="280" stroke="#64748b" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
        <line x1="1050" y1="280" x2="700" y2="500" stroke="#64748b" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
        
        {/* To Stakeholders */}
        <line x1="700" y1="500" x2="350" y2="750" stroke="#64748b" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
        <line x1="350" y1="750" x2="700" y2="500" stroke="#64748b" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
        
        {/* To Intersection Zone */}
        <line x1="700" y1="500" x2="1050" y2="750" stroke="#64748b" strokeWidth="3" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />

        {/* Center: SCRUM MASTER */}
        <g id="scrumMaster">
          <circle cx="700" cy="500" r="120" fill="url(#smGradient)" stroke="#1e293b" strokeWidth="4" />
          <text
            x="700"
            y="480"
            fontSize="24"
            fontWeight="bold"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            SCRUM MASTER
          </text>
          <text
            x="700"
            y="505"
            fontSize="14"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ცენტრალური როლი
          </text>
          <text
            x="700"
            y="525"
            fontSize="12"
            textAnchor="middle"
            fill="#e0f2fe"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ფასილიტატორი • მწვრთნელი
          </text>
          <text
            x="700"
            y="542"
            fontSize="12"
            textAnchor="middle"
            fill="#e0f2fe"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ფარი • კოუჩი
          </text>
        </g>

        {/* Top Left: PRODUCT OWNERS */}
        <g id="productOwners">
          <rect
            x="150"
            y="150"
            width="400"
            height="260"
            rx="15"
            fill="url(#poGradient)"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <text
            x="350"
            y="185"
            fontSize="22"
            fontWeight="bold"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            PRODUCT OWNERS (5 PO)
          </text>
          <text
            x="350"
            y="210"
            fontSize="14"
            fontStyle="italic"
            textAnchor="middle"
            fill="#d1fae5"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ფოკუსი: პროცესის ხარისხი და მზაობა
          </text>
          
          {/* Content bullets */}
          <text x="170" y="240" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ DoR (Definition of Ready) დაცვა
          </text>
          <text x="170" y="265" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ ეფექტური Backlog Management
          </text>
          <text x="170" y="290" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Dependencies მართვა 5 გუნდს შორის
          </text>
          <text x="170" y="315" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Velocity ანალიზი და პროგნოზები
          </text>
          <text x="170" y="340" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Scrum of Scrums ფასილიტაცია
          </text>
          <text x="170" y="365" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ ბექლოგის პრიორიტეტიზაცია
          </text>
          <text x="170" y="390" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Story slicing ტექნიკები
          </text>
        </g>

        {/* Top Right: DEVELOPMENT TEAMS */}
        <g id="developmentTeams">
          <rect
            x="850"
            y="150"
            width="400"
            height="260"
            rx="15"
            fill="url(#devGradient)"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <text
            x="1050"
            y="185"
            fontSize="22"
            fontWeight="bold"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            DEVELOPMENT TEAMS
          </text>
          <text
            x="1050"
            y="210"
            fontSize="14"
            fontStyle="italic"
            textAnchor="middle"
            fill="#fef3c7"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ფოკუსი: ეფექტურობა და გუნდის ჯანმრთელობა
          </text>
          
          {/* Content bullets */}
          <text x="870" y="240" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Impediment Removal (ბლოკერების მოხსნა)
          </text>
          <text x="870" y="265" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ შეფასების ფასილიტაცია (Story Points)
          </text>
          <text x="870" y="290" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Burndown მონიტორინგი
          </text>
          <text x="870" y="315" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Team Happiness და მოტივაცია
          </text>
          <text x="870" y="340" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ რეტროსპექტივების ფასილიტაცია
          </text>
          <text x="870" y="365" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ გუნდური შეფასება (არა თავსმოხვეული)
          </text>
          <text x="870" y="390" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ რისკების დროული შეტყობინება
          </text>
        </g>

        {/* Bottom Left: STAKEHOLDERS */}
        <g id="stakeholders">
          <rect
            x="150"
            y="620"
            width="400"
            height="260"
            rx="15"
            fill="url(#shGradient)"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <text
            x="350"
            y="655"
            fontSize="22"
            fontWeight="bold"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            STAKEHOLDERS
          </text>
          <text
            x="350"
            y="680"
            fontSize="14"
            fontStyle="italic"
            textAnchor="middle"
            fill="#ede9fe"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ფოკუსი: მოლოდინების მართვა და განათლება
          </text>
          
          {/* Content bullets */}
          <text x="170" y="710" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Agile განათლება
          </text>
          <text x="170" y="735" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ ცვალებადი Scope-ის უპირატესობები
          </text>
          <text x="170" y="760" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ რეალური მონაცემები (არა დაპირებები)
          </text>
          <text x="170" y="785" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ გუნდის დაცვა გარე ზეწოლისგან
          </text>
          <text x="170" y="810" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ სპრინტის შუა-გზაზე ცვლილებების თავიდან აცილება
          </text>
          <text x="170" y="835" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ გამჭვირვალობა და რეალისტური პროგნოზი
          </text>
          <text x="170" y="860" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ 5 გუნდის შესაძლებლობების დემონსტრაცია
          </text>
        </g>

        {/* Bottom Right: INTERSECTION ZONE */}
        <g id="intersectionZone">
          <rect
            x="850"
            y="620"
            width="400"
            height="260"
            rx="15"
            fill="url(#intersectionGradient)"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <text
            x="1050"
            y="655"
            fontSize="20"
            fontWeight="bold"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            გადაკვეთის ზონა
          </text>
          <text
            x="1050"
            y="678"
            fontSize="16"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            SM + POs + SHs (ერთად)
          </text>
          <text
            x="1050"
            y="700"
            fontSize="13"
            fontStyle="italic"
            textAnchor="middle"
            fill="#fce7f3"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ფოკუსი: გამჭვირვალობა და სტრატეგია
          </text>
          
          {/* Content bullets */}
          <text x="870" y="730" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Sprint Review (Demo) ფასილიტაცია
          </text>
          <text x="870" y="755" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ კონსტრუქციული უკუკავშირი
          </text>
          <text x="870" y="780" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ QBR (კვარტალური შეხვედრები)
          </text>
          <text x="870" y="805" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Roadmap-ის პროგრესის წარდგენა
          </text>
          <text x="870" y="830" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ ბიზნეს ღირებულების დემონსტრაცია
          </text>
          <text x="870" y="855" fontSize="13" fill="white" fontFamily="system-ui, -apple-system, sans-serif">
            ✓ Roadmap Alignment (სტრატეგიული თანხვედრა)
          </text>
        </g>

        {/* Legend at bottom */}
        <g id="legend">
          <text
            x="700"
            y="960"
            fontSize="14"
            textAnchor="middle"
            fill="#64748b"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ეს დიაგრამა აგებულია "ჰაბის" (Hub) პრინციპით - Scrum Master ცენტრში მართავს პროცესებს სხვადასხვა მიმართულებით
          </text>
          <text
            x="700"
            y="985"
            fontSize="12"
            textAnchor="middle"
            fill="#94a3b8"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ორმხრივი ისრები (↔️) აჩვენებს აქტიურ, უწყვეტ კომუნიკაციას ყველა როლს შორის
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ScrumMasterInteractionMap;
