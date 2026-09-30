import React, { useState, useEffect } from 'react';
import { 
  PageHeader, DataTable, Button, Card, Input, MaskedInput, 
  FileUpload, StatsCard, ConfirmDialog 
} from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { formatCurrency, parseCurrency, validateCPF } from '../../utils/formatters';
import './DoacoesPage.css';

export default function DoacoesPage() {
  const { addToast } = useToast();
  const [doacoes, setDoacoes] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentDoacao, setCurrentDoacao] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    data: '', nomeDoador: '', valor: '', cpf: '', numeroDocumento: '', identidades: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'doacoes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoacoes(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching doacoes:', error);
      addToast('Erro ao carregar doações', 'error');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [addToast]);

  const totalValor = doacoes.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const columns = [
    { key: 'data', label: 'Data' },
    { key: 'nomeDoador', label: 'Doador' },
    { key: 'cpf', label: 'CPF' },
    { key: 'valorFormatted', label: 'Valor' },
    { key: 'numeroDocumento', label: 'Nº Documento' },
    { key: 'actions', label: 'Ações' }
  ];

  const handleCpfChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, cpf: val }));
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        setErrors(prev => ({ ...prev, cpf: 'CPF inválido (dígitos verificadores incorretos).' }));
      } else {
        setErrors(prev => ({ ...prev, cpf: null }));
      }
    } else if (clean.length > 0 && clean.length < 11) {
      setErrors(prev => ({ ...prev, cpf: 'CPF incompleto (11 dígitos).' }));
    } else {
      setErrors(prev => ({ ...prev, cpf: null }));
    }
  };

  const handleOpenForm = (doacao = null) => {
    if (doacao) {
      setFormData({ ...doacao, valor: doacao.valor ? doacao.valor.toString() : '' });
      setCurrentDoacao(doacao);
    } else {
      setFormData({ data: '', nomeDoador: '', valor: '', cpf: '', numeroDocumento: '', identidades: [] });
      setCurrentDoacao(null);
    }
    setErrors({});
    setUploadProgress(0);
    setViewMode('form');
    window.scrollTo(0, 0);
  };

  const handleSave = async () => {
    if (!formData.data || !formData.nomeDoador || !formData.valor || !formData.cpf) {
      addToast('Preencha os campos obrigatórios', 'error');
      return;
    }
    
    if (!validateCPF(formData.cpf)) {
      setErrors(prev => ({ ...prev, cpf: 'CPF inválido. Corrija o campo antes de salvar.' }));
      addToast('CPF inválido. Verifique os números digitados.', 'error');
      return;
    }

    if (errors.cpf) {
      addToast('Corrija o erro no campo de CPF antes de salvar.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const valorNum = parseCurrency(formData.valor.toString());
      
      const doacaoData = {
        data: formData.data,
        nomeDoador: formData.nomeDoador,
        valor: valorNum,
        cpf: formData.cpf,
        numeroDocumento: formData.numeroDocumento,
      };

      let docId;
      if (currentDoacao) {
        docId = currentDoacao.id;
        const doacaoRef = doc(db, 'doacoes', docId);
        await updateDoc(doacaoRef, {
          ...doacaoData,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'doacoes'), {
          ...doacaoData,
          identidades: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        docId = docRef.id;
      }

      const currentFiles = formData.identidades || [];
      const filesToUpload = currentFiles.filter(f => f instanceof File);
      const existingFiles = currentFiles.filter(f => !(f instanceof File));

      // Limpar do Storage arquivos que foram removidos durante a edicao
      if (currentDoacao && currentDoacao.identidades) {
        const removedFiles = currentDoacao.identidades.filter(
          oldFile => !existingFiles.some(newFile => newFile.name === oldFile.name)
        );
        removedFiles.forEach((file) => {
          if (file.name) {
            const fileRef = ref(storage, `identidades/${docId}/${file.name}`);
            deleteObject(fileRef).catch(e => console.warn('Erro ao apagar anexo removido:', e));
          }
        });
      }
      
      let finalIdentidades = [...existingFiles];
      
      if (filesToUpload.length > 0) {
        const uploadPromises = filesToUpload.map((file) => {
          return new Promise((resolve, reject) => {
            const fileRef = ref(storage, `identidades/${docId}/${file.name}`);
            const uploadTask = uploadBytesResumable(fileRef, file);
            
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
              },
              (error) => reject(error),
              async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  name: file.name,
                  url: downloadUrl,
                  size: file.size
                });
              }
            );
          });
        });
        
        const uploadedFiles = await Promise.all(uploadPromises);
        finalIdentidades = [...finalIdentidades, ...uploadedFiles];
      }
      
      const finalRef = doc(db, 'doacoes', docId);
      await updateDoc(finalRef, {
        identidades: finalIdentidades
      });
      
      addToast(currentDoacao ? 'Doação atualizada com sucesso' : 'Doação registrada com sucesso', 'success');
      setViewMode('list');
    } catch (error) {
      console.error('Erro ao salvar doação:', error);
      addToast('Erro ao salvar doação', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (currentDoacao) {
        // 1. Apagar anexos do Storage
        if (currentDoacao.identidades && currentDoacao.identidades.length > 0) {
          const deletePromises = currentDoacao.identidades.map((item) => {
            if (item.name) {
              const fileRef = ref(storage, `identidades/${currentDoacao.id}/${item.name}`);
              return deleteObject(fileRef).catch((e) => console.warn('Erro ao apagar anexo:', e));
            }
            return Promise.resolve();
          });
          await Promise.all(deletePromises);
        }

        // 2. Apagar registro do Firestore
        await deleteDoc(doc(db, 'doacoes', currentDoacao.id));
        addToast('Doação excluída com sucesso', 'success');
        setIsConfirmOpen(false);
      }
    } catch (error) {
      console.error('Erro ao excluir doação:', error);
      addToast('Erro ao excluir doação', 'error');
    }
  };

  const dataWithActions = doacoes.map(d => ({
    ...d,
    valorFormatted: formatCurrency(d.valor),
    actions: (
      <div className="action-buttons">
        <Button variant="icon" onClick={() => { setCurrentDoacao(d); setViewMode('details'); window.scrollTo(0, 0); }}>👁️</Button>
        <Button variant="icon" onClick={() => handleOpenForm(d)}>✏️</Button>
        <Button variant="icon" className="danger" onClick={() => { setCurrentDoacao(d); setIsConfirmOpen(true); }}>🗑️</Button>
      </div>
    )
  }));

  return (
    <div className="doacoes-page">
      {viewMode === 'list' && (
        <>
          <PageHeader 
            title="Doações" 
            actions={<Button onClick={() => handleOpenForm()}>Nova Doação</Button>} 
          />

          <div className="stats-container">
            <StatsCard title="Total de Doações" value={doacoes.length} />
            <StatsCard title="Valor Total" value={formatCurrency(totalValor)} />
          </div>

          <div className="filter-bar">
            <Input placeholder="Buscar por nome..." />
            <MaskedInput mask="date" placeholder="Data inicial" />
            <MaskedInput mask="date" placeholder="Data final" />
          </div>

          <DataTable columns={columns} data={dataWithActions} isLoading={isLoading} />
        </>
      )}

      {viewMode === 'form' && (
        <>
          <PageHeader 
            title={currentDoacao ? "Editar Doação" : "Nova Doação"} 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card className="form-card">
            <div className="form-grid">
              <MaskedInput mask="date" label="Data da doação" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
              <Input label="Nome Completo do Doador" value={formData.nomeDoador} onChange={(e) => setFormData({...formData, nomeDoador: e.target.value})} required />
              <MaskedInput mask="currency" label="Valor (R$)" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} required />
              <MaskedInput mask="cpf" label="CPF" value={formData.cpf} onChange={handleCpfChange} error={errors.cpf} required />
              <Input label="Nº do Documento no extrato" value={formData.numeroDocumento} onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})} required />
            </div>
            <div className="mt-4">
              <FileUpload 
                key={currentDoacao ? currentDoacao.id : 'new'}
                label="Identidade do Doador" 
                multiple 
                accept=".pdf,image/*" 
                initialFiles={currentDoacao && currentDoacao.identidades ? currentDoacao.identidades : []}
                onFilesChange={(files) => setFormData({...formData, identidades: Array.from(files)})} 
                isUploading={isSubmitting}
                uploadProgress={uploadProgress}
              />
            </div>
            <div className="modal-actions mt-4" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setViewMode('list')} disabled={isSubmitting}>Cancelar</Button>
              <Button onClick={handleSave} isLoading={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </Card>
        </>
      )}

      {viewMode === 'details' && currentDoacao && (
        <>
          <PageHeader 
            title="Detalhes da Doação" 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card className="view-details-card">
            <div className="view-details">
              <p><strong>Data:</strong> {currentDoacao.data}</p>
              <p><strong>Doador:</strong> {currentDoacao.nomeDoador}</p>
              <p><strong>CPF:</strong> {currentDoacao.cpf}</p>
              <p><strong>Valor:</strong> {formatCurrency(currentDoacao.valor)}</p>
              <p><strong>Documento:</strong> {currentDoacao.numeroDocumento}</p>
              <div className="mt-4">
                <h4>Documentos Anexados:</h4>
                <ul>
                  {currentDoacao.identidades?.map((f, i) => (
                    <li key={i}>
                      {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a> : f.name}
                    </li>
                  ))}
                  {(!currentDoacao.identidades || currentDoacao.identidades.length === 0) && <li>Nenhum documento anexado.</li>}
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleDelete} 
        title="Excluir Doação" 
        message="Tem certeza que deseja excluir esta doação? Esta ação não pode ser desfeita." 
      />
    </div>
  );
}
