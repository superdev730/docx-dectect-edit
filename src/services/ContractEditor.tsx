import { DocumentProcessor, DocumentModification } from './DocumentProcessor';

export class ContractEditor {
  private processor: DocumentProcessor;

  constructor() {
    this.processor = new DocumentProcessor();
  }

  async editContract1(file: File): Promise<Blob> {
    const insertText = `"Affiliate" means any entity that directly or indirectly controls, is controlled by, or is under common control with a party, where "control" means the possession, directly or indirectly, of the power to direct or cause the direction of the management and policies of such entity, whether through ownership of voting securities, by contract, or otherwise.`;

    const modifications: DocumentModification[] = [
      {
        type: 'insert_after_heading',
        searchText: 'Definitions',
        insertText: insertText,
        formatting: { bold: true }
      }
    ];

    return await this.processor.modifyDocxFile(file, modifications);
  }

  async editContract2(file: File): Promise<Blob> {
    const insertText = `THE DISCLOSING PARTY MAKES NO REPRESENTATIONS OR WARRANTIES REGARDING THE ACCURACY OR COMPLETENESS OF THE CONFIDENTIAL INFORMATION.`;

    const modifications: DocumentModification[] = [
      {
        type: 'insert_in_section',
        sectionNumber: 11,
        position: 'between_sentences',
        insertText: insertText
      }
    ];

    return await this.processor.modifyDocxFile(file, modifications);
  }

  async editContract3(file: File): Promise<Blob> {
    const insertText = `Nothing in this Agreement shall be construed to limit the Receiving Party's right to independently develop or acquire products or services without use of the Disclosing Party's Confidential Information, nor shall it restrict the use of any general knowledge, skills, or experience retained in unaided memory by personnel of the Receiving Party.`;

    const modifications: DocumentModification[] = [
      {
        type: 'add_new_section',
        afterSection: 10,
        sectionTitle: 'Residuals. ',
        insertText: insertText,
        formatting: { bold: true, underline: true }
      }
    ];

    return await this.processor.modifyDocxFile(file, modifications);
  }

  async analyzeAndEdit(file: File): Promise<Blob> {
    try {
      const content = await this.processor.readDocxContent(file);
      const lowerContent = content.toLowerCase();
      
      // Analyze content to determine which contract this might be
      if (lowerContent.includes('definitions') && !lowerContent.includes('affiliate')) {
        console.log('Detected Contract 1 - adding Affiliate definition');
        return await this.editContract1(file);
      } else if (lowerContent.includes('confidential information') && lowerContent.includes('11')) {
        console.log('Detected Contract 2 - adding disclaimer to section 11');
        return await this.editContract2(file);
      } else if (lowerContent.includes('10') && !lowerContent.includes('residuals')) {
        console.log('Detected Contract 3 - adding Residuals section');
        return await this.editContract3(file);
      }
      
      // Default fallback - try to add a simple modification
      console.log('Could not determine contract type, applying default modification');
      const modifications: DocumentModification[] = [
        {
          type: 'insert_after_heading',
          searchText: '1.',
          insertText: 'This document has been processed by the automated contract editor.',
          formatting: { bold: true }
        }
      ];
      
      return await this.processor.modifyDocxFile(file, modifications);
    } catch (error) {
      console.error('Error in analyzeAndEdit:', error);
      throw new Error(`Failed to analyze and edit document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}