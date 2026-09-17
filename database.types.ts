export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aluno: {
        Row: {
          cpf: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id_aluno: number
          id_usuario: string | null
          nome: string
          status: string
          telefone: string | null
        }
        Insert: {
          cpf?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id_aluno?: never
          id_usuario?: string | null
          nome: string
          status?: string
          telefone?: string | null
        }
        Update: {
          cpf?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id_aluno?: never
          id_usuario?: string | null
          nome?: string
          status?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aluno_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: true
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      aluno_responsavel: {
        Row: {
          id_aluno: number
          id_responsavel: number
          parentesco: string | null
          principal: boolean
        }
        Insert: {
          id_aluno: number
          id_responsavel: number
          parentesco?: string | null
          principal?: boolean
        }
        Update: {
          id_aluno?: number
          id_responsavel?: number
          parentesco?: string | null
          principal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_aluno_responsavel_aluno"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "aluno"
            referencedColumns: ["id_aluno"]
          },
          {
            foreignKeyName: "fk_aluno_responsavel_responsavel"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      aula: {
        Row: {
          data_aula: string
          horario_fim: string | null
          horario_inicio: string
          id_aula: number
          id_turma: number
          qr_code: string | null
          status: string
        }
        Insert: {
          data_aula: string
          horario_fim?: string | null
          horario_inicio: string
          id_aula?: never
          id_turma: number
          qr_code?: string | null
          status?: string
        }
        Update: {
          data_aula?: string
          horario_fim?: string | null
          horario_inicio?: string
          id_aula?: never
          id_turma?: number
          qr_code?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aula_id_turma_fkey"
            columns: ["id_turma"]
            isOneToOne: false
            referencedRelation: "turma"
            referencedColumns: ["id_turma"]
          },
        ]
      }
      avaliacao: {
        Row: {
          data_avaliacao: string
          id_aluno: number
          id_avaliacao: number
          id_professor: number
          metas: string | null
          observacoes: string | null
        }
        Insert: {
          data_avaliacao?: string
          id_aluno: number
          id_avaliacao?: never
          id_professor: number
          metas?: string | null
          observacoes?: string | null
        }
        Update: {
          data_avaliacao?: string
          id_aluno?: number
          id_avaliacao?: never
          id_professor?: number
          metas?: string | null
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "aluno"
            referencedColumns: ["id_aluno"]
          },
          {
            foreignKeyName: "avaliacao_id_professor_fkey"
            columns: ["id_professor"]
            isOneToOne: false
            referencedRelation: "professor"
            referencedColumns: ["id_professor"]
          },
        ]
      }
      avaliacao_criterio: {
        Row: {
          id_avaliacao: number
          id_criterio: number
          nota: number | null
          observacao: string | null
        }
        Insert: {
          id_avaliacao: number
          id_criterio: number
          nota?: number | null
          observacao?: string | null
        }
        Update: {
          id_avaliacao?: number
          id_criterio?: number
          nota?: number | null
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_criterio_id_avaliacao_fkey"
            columns: ["id_avaliacao"]
            isOneToOne: false
            referencedRelation: "avaliacao"
            referencedColumns: ["id_avaliacao"]
          },
          {
            foreignKeyName: "avaliacao_criterio_id_criterio_fkey"
            columns: ["id_criterio"]
            isOneToOne: false
            referencedRelation: "criterio_avaliacao"
            referencedColumns: ["id_criterio"]
          },
        ]
      }
      categoria_produto: {
        Row: {
          descricao: string | null
          id_categoria: number
          nome: string
          status: string
        }
        Insert: {
          descricao?: string | null
          id_categoria?: number
          nome: string
          status?: string
        }
        Update: {
          descricao?: string | null
          id_categoria?: number
          nome?: string
          status?: string
        }
        Relationships: []
      }
      comunicado: {
        Row: {
          conteudo: string
          data_envio: string
          id_comunicado: number
          id_usuario: string
          titulo: string
        }
        Insert: {
          conteudo: string
          data_envio?: string
          id_comunicado?: never
          id_usuario: string
          titulo: string
        }
        Update: {
          conteudo?: string
          data_envio?: string
          id_comunicado?: never
          id_usuario?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicado_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      comunicado_usuario: {
        Row: {
          data_leitura: string | null
          id_comunicado: number
          id_usuario: string
          lido: boolean
        }
        Insert: {
          data_leitura?: string | null
          id_comunicado: number
          id_usuario: string
          lido?: boolean
        }
        Update: {
          data_leitura?: string | null
          id_comunicado?: number
          id_usuario?: string
          lido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "comunicado_usuario_id_comunicado_fkey"
            columns: ["id_comunicado"]
            isOneToOne: false
            referencedRelation: "comunicado"
            referencedColumns: ["id_comunicado"]
          },
          {
            foreignKeyName: "comunicado_usuario_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      criterio_avaliacao: {
        Row: {
          descricao: string | null
          id_criterio: number
          nome: string
        }
        Insert: {
          descricao?: string | null
          id_criterio?: never
          nome: string
        }
        Update: {
          descricao?: string | null
          id_criterio?: never
          nome?: string
        }
        Relationships: []
      }
      evento: {
        Row: {
          data_evento: string
          descricao: string | null
          horario: string
          id_evento: number
          local: string | null
          nome: string
          status: string
        }
        Insert: {
          data_evento: string
          descricao?: string | null
          horario: string
          id_evento?: never
          local?: string | null
          nome: string
          status?: string
        }
        Update: {
          data_evento?: string
          descricao?: string | null
          horario?: string
          id_evento?: never
          local?: string | null
          nome?: string
          status?: string
        }
        Relationships: []
      }
      evento_turma: {
        Row: {
          id_evento: number
          id_turma: number
        }
        Insert: {
          id_evento: number
          id_turma: number
        }
        Update: {
          id_evento?: number
          id_turma?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_turma_id_evento_fkey"
            columns: ["id_evento"]
            isOneToOne: false
            referencedRelation: "evento"
            referencedColumns: ["id_evento"]
          },
          {
            foreignKeyName: "evento_turma_id_turma_fkey"
            columns: ["id_turma"]
            isOneToOne: false
            referencedRelation: "turma"
            referencedColumns: ["id_turma"]
          },
        ]
      }
      forma_pagamento: {
        Row: {
          descricao: string
          id_forma_pagamento: number
        }
        Insert: {
          descricao: string
          id_forma_pagamento?: never
        }
        Update: {
          descricao?: string
          id_forma_pagamento?: never
        }
        Relationships: []
      }
      frequencia: {
        Row: {
          data_registro: string
          id_aluno: number
          id_aula: number
          id_frequencia: number
          presente: boolean
        }
        Insert: {
          data_registro?: string
          id_aluno: number
          id_aula: number
          id_frequencia?: never
          presente?: boolean
        }
        Update: {
          data_registro?: string
          id_aluno?: number
          id_aula?: number
          id_frequencia?: never
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "aluno"
            referencedColumns: ["id_aluno"]
          },
          {
            foreignKeyName: "frequencia_id_aula_fkey"
            columns: ["id_aula"]
            isOneToOne: false
            referencedRelation: "aula"
            referencedColumns: ["id_aula"]
          },
        ]
      }
      imagem_produto: {
        Row: {
          caminho: string
          id_imagem: number
          id_produto: number
          ordem: number
          principal: boolean
        }
        Insert: {
          caminho: string
          id_imagem?: number
          id_produto: number
          ordem?: number
          principal?: boolean
        }
        Update: {
          caminho?: string
          id_imagem?: number
          id_produto?: number
          ordem?: number
          principal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_imagem_produto"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produto"
            referencedColumns: ["id_produto"]
          },
        ]
      }
      item_pedido: {
        Row: {
          id_pedido: number
          id_produto: number
          preco_unitario: number
          quantidade: number
          subtotal: number
        }
        Insert: {
          id_pedido: number
          id_produto: number
          preco_unitario: number
          quantidade: number
          subtotal: number
        }
        Update: {
          id_pedido?: number
          id_produto?: number
          preco_unitario?: number
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_item_pedido"
            columns: ["id_pedido"]
            isOneToOne: false
            referencedRelation: "pedido"
            referencedColumns: ["id_pedido"]
          },
          {
            foreignKeyName: "fk_item_produto"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produto"
            referencedColumns: ["id_produto"]
          },
        ]
      }
      matricula: {
        Row: {
          data_matricula: string
          id_aluno: number
          id_matricula: number
          id_turma: number
          status: string
        }
        Insert: {
          data_matricula?: string
          id_aluno: number
          id_matricula?: never
          id_turma: number
          status?: string
        }
        Update: {
          data_matricula?: string
          id_aluno?: number
          id_matricula?: never
          id_turma?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "matricula_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "aluno"
            referencedColumns: ["id_aluno"]
          },
          {
            foreignKeyName: "matricula_id_turma_fkey"
            columns: ["id_turma"]
            isOneToOne: false
            referencedRelation: "turma"
            referencedColumns: ["id_turma"]
          },
        ]
      }
      mensalidade: {
        Row: {
          competencia: string
          id_aluno: number
          id_mensalidade: number
          status: string
          valor: number
          vencimento: string
        }
        Insert: {
          competencia: string
          id_aluno: number
          id_mensalidade?: never
          status?: string
          valor: number
          vencimento: string
        }
        Update: {
          competencia?: string
          id_aluno?: number
          id_mensalidade?: never
          status?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensalidade_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "aluno"
            referencedColumns: ["id_aluno"]
          },
        ]
      }
      modalidade: {
        Row: {
          descricao: string | null
          id_modalidade: number
          nome: string
          status: string
        }
        Insert: {
          descricao?: string | null
          id_modalidade?: never
          nome: string
          status?: string
        }
        Update: {
          descricao?: string | null
          id_modalidade?: never
          nome?: string
          status?: string
        }
        Relationships: []
      }
      movimentacao_estoque: {
        Row: {
          data_movimentacao: string
          id_movimentacao: number
          id_produto: number
          id_usuario: string
          observacao: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          data_movimentacao?: string
          id_movimentacao?: number
          id_produto: number
          id_usuario: string
          observacao?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          data_movimentacao?: string
          id_movimentacao?: number
          id_produto?: number
          id_usuario?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_movimentacao_produto"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produto"
            referencedColumns: ["id_produto"]
          },
          {
            foreignKeyName: "fk_movimentacao_usuario"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      pagamento: {
        Row: {
          data_pagamento: string
          id_forma_pagamento: number
          id_mensalidade: number
          id_pagamento: number
          valor: number
        }
        Insert: {
          data_pagamento?: string
          id_forma_pagamento: number
          id_mensalidade: number
          id_pagamento?: never
          valor: number
        }
        Update: {
          data_pagamento?: string
          id_forma_pagamento?: number
          id_mensalidade?: number
          id_pagamento?: never
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamento_id_forma_pagamento_fkey"
            columns: ["id_forma_pagamento"]
            isOneToOne: false
            referencedRelation: "forma_pagamento"
            referencedColumns: ["id_forma_pagamento"]
          },
          {
            foreignKeyName: "pagamento_id_mensalidade_fkey"
            columns: ["id_mensalidade"]
            isOneToOne: true
            referencedRelation: "mensalidade"
            referencedColumns: ["id_mensalidade"]
          },
        ]
      }
      pagamento_pedido: {
        Row: {
          data_pagamento: string
          id_forma_pagamento: number
          id_pagamento_pedido: number
          id_pedido: number
          status: string
          valor: number
        }
        Insert: {
          data_pagamento?: string
          id_forma_pagamento: number
          id_pagamento_pedido?: number
          id_pedido: number
          status?: string
          valor: number
        }
        Update: {
          data_pagamento?: string
          id_forma_pagamento?: number
          id_pagamento_pedido?: number
          id_pedido?: number
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_pagamento_pedido"
            columns: ["id_pedido"]
            isOneToOne: true
            referencedRelation: "pedido"
            referencedColumns: ["id_pedido"]
          },
          {
            foreignKeyName: "fk_pagamento_pedido_forma"
            columns: ["id_forma_pagamento"]
            isOneToOne: false
            referencedRelation: "forma_pagamento"
            referencedColumns: ["id_forma_pagamento"]
          },
        ]
      }
      pedido: {
        Row: {
          data_pedido: string
          id_pedido: number
          id_usuario: string
          observacoes: string | null
          status: string
          valor_total: number
        }
        Insert: {
          data_pedido?: string
          id_pedido?: number
          id_usuario: string
          observacoes?: string | null
          status?: string
          valor_total?: number
        }
        Update: {
          data_pedido?: string
          id_pedido?: number
          id_usuario?: string
          observacoes?: string | null
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_pedido_usuario"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      perfil: {
        Row: {
          descricao: string | null
          id_perfil: number
          nome: string
        }
        Insert: {
          descricao?: string | null
          id_perfil?: never
          nome: string
        }
        Update: {
          descricao?: string | null
          id_perfil?: never
          nome?: string
        }
        Relationships: []
      }
      possivel_aluno: {
        Row: {
          data_aula_experimental: string | null
          data_contato: string | null
          data_nascimento: string | null
          email: string | null
          horario_aula_experimental: string | null
          id_possivel_aluno: number
          id_turma: number | null
          nome: string
          nome_responsavel: string | null
          observacoes: string | null
          origem: string | null
          status: string
          telefone: string
          telefone_responsavel: string | null
        }
        Insert: {
          data_aula_experimental?: string | null
          data_contato?: string | null
          data_nascimento?: string | null
          email?: string | null
          horario_aula_experimental?: string | null
          id_possivel_aluno?: number
          id_turma?: number | null
          nome: string
          nome_responsavel?: string | null
          observacoes?: string | null
          origem?: string | null
          status?: string
          telefone: string
          telefone_responsavel?: string | null
        }
        Update: {
          data_aula_experimental?: string | null
          data_contato?: string | null
          data_nascimento?: string | null
          email?: string | null
          horario_aula_experimental?: string | null
          id_possivel_aluno?: number
          id_turma?: number | null
          nome?: string
          nome_responsavel?: string | null
          observacoes?: string | null
          origem?: string | null
          status?: string
          telefone?: string
          telefone_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_possivel_aluno_turma"
            columns: ["id_turma"]
            isOneToOne: false
            referencedRelation: "turma"
            referencedColumns: ["id_turma"]
          },
        ]
      }
      produto: {
        Row: {
          descricao: string | null
          estoque: number
          estoque_minimo: number
          id_categoria: number
          id_produto: number
          nome: string
          preco: number
          sku: string | null
          status: string
        }
        Insert: {
          descricao?: string | null
          estoque?: number
          estoque_minimo?: number
          id_categoria: number
          id_produto?: number
          nome: string
          preco?: number
          sku?: string | null
          status?: string
        }
        Update: {
          descricao?: string | null
          estoque?: number
          estoque_minimo?: number
          id_categoria?: number
          id_produto?: number
          nome?: string
          preco?: number
          sku?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produto_categoria"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categoria_produto"
            referencedColumns: ["id_categoria"]
          },
        ]
      }
      professor: {
        Row: {
          cpf: string | null
          email: string | null
          especialidade: string | null
          id_professor: number
          id_usuario: string | null
          nome: string
          status: string
          telefone: string | null
        }
        Insert: {
          cpf?: string | null
          email?: string | null
          especialidade?: string | null
          id_professor?: never
          id_usuario?: string | null
          nome: string
          status?: string
          telefone?: string | null
        }
        Update: {
          cpf?: string | null
          email?: string | null
          especialidade?: string | null
          id_professor?: never
          id_usuario?: string | null
          nome?: string
          status?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: true
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      responsavel: {
        Row: {
          cpf: string | null
          data_cadastro: string
          email: string | null
          endereco: string | null
          id_responsavel: number
          nome: string
          status: string
          telefone: string | null
        }
        Insert: {
          cpf?: string | null
          data_cadastro?: string
          email?: string | null
          endereco?: string | null
          id_responsavel?: number
          nome: string
          status?: string
          telefone?: string | null
        }
        Update: {
          cpf?: string | null
          data_cadastro?: string
          email?: string | null
          endereco?: string | null
          id_responsavel?: number
          nome?: string
          status?: string
          telefone?: string | null
        }
        Relationships: []
      }
      turma: {
        Row: {
          capacidade: number
          dia_semana: string
          horario: string
          id_modalidade: number
          id_professor: number
          id_turma: number
          nome: string
          status: string
        }
        Insert: {
          capacidade: number
          dia_semana: string
          horario: string
          id_modalidade: number
          id_professor: number
          id_turma?: never
          nome: string
          status?: string
        }
        Update: {
          capacidade?: number
          dia_semana?: string
          horario?: string
          id_modalidade?: number
          id_professor?: number
          id_turma?: never
          nome?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_id_modalidade_fkey"
            columns: ["id_modalidade"]
            isOneToOne: false
            referencedRelation: "modalidade"
            referencedColumns: ["id_modalidade"]
          },
          {
            foreignKeyName: "turma_id_professor_fkey"
            columns: ["id_professor"]
            isOneToOne: false
            referencedRelation: "professor"
            referencedColumns: ["id_professor"]
          },
        ]
      }
      usuario: {
        Row: {
          email: string
          id_perfil: number
          id_usuario: string
          nome: string
          status: string
          telefone: string | null
        }
        Insert: {
          email: string
          id_perfil: number
          id_usuario: string
          nome: string
          status?: string
          telefone?: string | null
        }
        Update: {
          email?: string
          id_perfil?: number
          id_usuario?: string
          nome?: string
          status?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_id_perfil_fkey"
            columns: ["id_perfil"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id_perfil"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_aluno: { Args: never; Returns: boolean }
      is_professor: { Args: never; Returns: boolean }
      meu_perfil: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
