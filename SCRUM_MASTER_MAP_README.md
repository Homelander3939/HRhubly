# Scrum Master Interaction Map

## სკრამ მასტერის ინტერაქციის რუკა

ეს დიაგრამა წარმოადგენს Scrum Master-ის ინტერაქციებს 5 გუნდიანი სტრუქტურის ფარგლებში, აგებული "Hub" (ჰაბის) პრინციპით.

### მახასიათებლები

- **ცენტრალური როლი**: Scrum Master ცენტრში როგორც ფასილიტატორი, მწვრთნელი და ფარი
- **ოთხი ძირითადი ინტერაქცია**:
  1. SM ↔️ Product Owners (POs)
  2. SM ↔️ Development Teams
  3. SM ↔️ Stakeholders (SHs)
  4. გადაკვეთის ზონა (SM + POs + SHs)

### როგორ გამოვიყენოთ

#### 1. HTML ფაილის გახსნა
უბრალოდ გახსენით `scrum-master-interaction-map.html` ფაილი ნებისმიერ თანამედროვე ბრაუზერში:
- Chrome
- Firefox
- Safari
- Edge

#### 2. React კომპონენტის გამოყენება
თუ გსურთ დიაგრამის ინტეგრაცია React აპლიკაციაში:

```tsx
import { ScrumMasterInteractionMap } from './ScrumMasterInteractionMap';

function App() {
  return (
    <div>
      <ScrumMasterInteractionMap />
    </div>
  );
}
```

#### 3. დიაგრამის გადმოწერა
HTML გვერდზე ხელმისაწვდომია ორი ღილაკი:
- **Download SVG**: Vector ფორმატში (მასშტაბირებადი, უმაღლესი ხარისხი)
- **Download PNG**: Raster ფორმატში (2800x2000px, მაღალი გარჩევადობა)

### ფაილები

1. **scrum-master-interaction-map.html** - Standalone HTML ფაილი სრული ფუნქციონალით
2. **ScrumMasterInteractionMap.tsx** - React კომპონენტი
3. **ScrumMasterDiagramPage.tsx** - სრული გვერდი React-ისთვის

### დიაგრამის სტრუქტურა

#### 1. ცენტრი: SCRUM MASTER
- ფასილიტატორი
- მწვრთნელი (Coach)
- ფარი

#### 2. SM ↔️ PRODUCT OWNERS
**ფოკუსი**: პროცესის ხარისხი და მზაობა
- DoR (Definition of Ready) დაცვა
- ეფექტური Backlog Management
- Dependencies მართვა
- Velocity ანალიზი

#### 3. SM ↔️ DEVELOPMENT TEAMS
**ფოკუსი**: ეფექტურობა და გუნდის ჯანმრთელობა
- Impediment Removal
- შეფასების ფასილიტაცია
- Burndown მონიტორინგი
- Team Happiness

#### 4. SM ↔️ STAKEHOLDERS
**ფოკუსი**: მოლოდინების მართვა და განათლება
- Agile განათლება
- მოლოდინების მართვა
- გუნდის დაცვა

#### 5. გადაკვეთის ზონა: SM + POs + STAKEHOLDERS
**ფოკუსი**: გამჭვირვალობა და სტრატეგიული თანხვედრა
- Sprint Review ფასილიტაცია
- QBR (კვარტალური შეხვედრები)
- Roadmap Alignment

### ტექნიკური დეტალები

- **ფორმატი**: SVG (Scalable Vector Graphics)
- **გარჩევადობა**: 1600x900 (base), 3200x1800 (PNG export)
- **ფონტები**: System UI fonts (ქართული ტექსტის მხარდაჭერით)
- **ფერები**: Modern gradient design
- **თავსებადობა**: ყველა თანამედროვე ბრაუზერი

### License

Created for HRhubly project.
