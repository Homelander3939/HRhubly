import { createFileRoute } from '@tanstack/react-router'
import ScrumMasterDiagramPage from '../../ScrumMasterDiagramPage'

export const Route = createFileRoute('/scrum-master-map')({
  component: ScrumMasterDiagramPage,
})
