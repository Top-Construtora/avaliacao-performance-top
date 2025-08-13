import React from 'react';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Briefcase,
  Building
} from 'lucide-react';

interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface PDIViewerProps {
  pdiData: {
    colaborador: string;
    cargo: string;
    departamento: string;
    periodo: string;
    nineBoxQuadrante?: string;
    nineBoxDescricao?: string;
    curtosPrazos: ActionItem[];
    mediosPrazos: ActionItem[];
    longosPrazos: ActionItem[];
    dataCriacao?: string;
    dataAtualizacao?: string;
  };
}

const PDIViewer: React.FC<PDIViewerProps> = ({ pdiData }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case '1': return 'text-red-600 bg-red-50';
      case '2': return 'text-orange-600 bg-orange-50';
      case '3': return 'text-yellow-600 bg-yellow-50';
      case '4': return 'text-blue-600 bg-blue-50';
      case '5': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '1': return <XCircle className="w-4 h-4" />;
      case '2': case '3': return <AlertCircle className="w-4 h-4" />;
      case '4': return <Clock className="w-4 h-4" />;
      case '5': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '1': return 'Não Iniciado';
      case '2': return 'Em Planejamento';
      case '3': return 'Em Andamento';
      case '4': return 'Quase Concluído';
      case '5': return 'Concluído';
      default: return 'Indefinido';
    }
  };

  // Função simples para formatar data sem date-fns
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderActionItems = (items: ActionItem[], title: string, bgColor: string) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className={`text-lg font-semibold mb-4 ${bgColor} p-3 rounded-lg`}>
          {title}
        </h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.competencia}</h4>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Prazo: {item.calendarizacao}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                  <span>{getStatusLabel(item.status)}</span>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700 mb-1">Como Desenvolver:</p>
                  <p className="text-gray-600">{item.comoDesenvolver}</p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-700 mb-1">Resultados Esperados:</p>
                  <p className="text-gray-600">{item.resultadosEsperados}</p>
                </div>
                
                {item.observacao && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Observações:</p>
                    <p className="text-gray-600">{item.observacao}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center mb-4">
          <FileText className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">
            Plano de Desenvolvimento Individual (PDI)
          </h1>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Colaborador</p>
              <p className="font-medium">{pdiData.colaborador}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Briefcase className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Cargo</p>
              <p className="font-medium">{pdiData.cargo}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Building className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Departamento</p>
              <p className="font-medium">{pdiData.departamento}</p>
            </div>
          </div>
        </div>

        {pdiData.nineBoxQuadrante && (
          <div className="mt-4 p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-700">
              <span className="font-medium">Posição Nine Box:</span> {pdiData.nineBoxQuadrante}
              {pdiData.nineBoxDescricao && ` - ${pdiData.nineBoxDescricao}`}
            </p>
          </div>
        )}
        
        {pdiData.periodo && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Período:</span> {pdiData.periodo}
            </p>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-gray-50 rounded-lg p-6">
        {renderActionItems(pdiData.curtosPrazos, 'Ações de Curto Prazo (0-6 meses)', 'bg-status-info/10 text-status-info border border-status-info/20')}
        {renderActionItems(pdiData.mediosPrazos, 'Ações de Médio Prazo (6-12 meses)', 'bg-status-warning/10 text-status-warning border border-status-warning/20')}
        {renderActionItems(pdiData.longosPrazos, 'Ações de Longo Prazo (12+ meses)', 'bg-status-success/10 text-status-success border border-status-success/20')}
      </div>

      {/* Footer */}
      {(pdiData.dataCriacao || pdiData.dataAtualizacao) && (
        <div className="mt-6 text-sm text-gray-500 text-center">
          {pdiData.dataCriacao && (
            <p>Criado em: {formatDate(pdiData.dataCriacao)}</p>
          )}
          {pdiData.dataAtualizacao && (
            <p>Última atualização: {formatDate(pdiData.dataAtualizacao)}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PDIViewer;