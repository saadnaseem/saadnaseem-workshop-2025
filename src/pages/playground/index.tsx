import { Container } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import StructureSketch from '../../components/KetcherSketch';

export const Route = createFileRoute('/playground/')({
  component: Playground,
});

/**
 * A chemical structure sketcher and SMILES converter.
 * Users can either draw structures using the Ketcher editor or input SMILES text directly.
 */
function Playground() {
  return (
    <Container
      maxWidth="xl"
      /**
       * Style STRUDEL and MUI components using the `sx` prop.
       * Increased vertical spacing for the larger Ketcher editor.
       */
      sx={{
        marginBottom: 4,
        marginTop: 4,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <StructureSketch />
    </Container>
  );
}
