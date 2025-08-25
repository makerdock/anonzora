import { CompiledCircuit, type Noir } from '@noir-lang/noir_js'
import { Barretenberg } from '@aztec/bb.js'

export type ProofData = {
  proof: Uint8Array
  publicInputs: string[]
}

type ProverModules = {
  Noir: typeof Noir
  Barretenberg: typeof Barretenberg
}

type VerifierModules = {
  Barretenberg: typeof Barretenberg
}

export abstract class Circuit {
  private proverPromise: Promise<ProverModules> | null = null
  private verifierPromise: Promise<VerifierModules> | null = null

  private circuit: CompiledCircuit
  private vkey: Uint8Array

  constructor(circuit: unknown, vkey: unknown) {
    this.circuit = circuit as CompiledCircuit
    this.vkey = vkey as Uint8Array
  }

  async initProver(): Promise<ProverModules> {
    if (!this.proverPromise) {
      this.proverPromise = (async () => {
        const [{ Noir }, { Barretenberg }] = await Promise.all([
          import('@noir-lang/noir_js'),
          import('@aztec/bb.js'),
        ])
        return {
          Noir,
          Barretenberg,
        }
      })()
    }
    return this.proverPromise
  }

  async initVerifier(): Promise<VerifierModules> {
    if (!this.verifierPromise) {
      this.verifierPromise = (async () => {
        const { Barretenberg } = await import('@aztec/bb.js')
        return { Barretenberg }
      })()
    }
    return this.verifierPromise
  }

  async verify(proofData: ProofData) {
    const { BarretenbergVerifier } = await this.initVerifier()

    console.log('Initializing BarretenbergVerifier for verification...')
    
    try {
      const verifier = new BarretenbergVerifier()
      const result = await verifier.verifyUltraHonkProof(proofData, this.vkey)
      console.log('Barretenberg verification result:', result)
      
      return result
    } catch (error) {
      console.error('Barretenberg verification error:', error)
      return false
    }
  }

  async generate(input: Record<string, any>) {
    const { Noir, UltraHonkBackend } = await this.initProver()

    console.log('Generating proof with Noir + UltraHonkBackend...')
    
    try {
      const noir = new Noir(this.circuit)
      const backend = new UltraHonkBackend(this.circuit.bytecode)
      
      const { witness } = await noir.execute(input)
      const proof = await backend.generateProof(witness)
      
      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs
      }
    } catch (error) {
      console.error('Proof generation error:', error)
      throw error
    }
  }

  abstract parseData(publicInputs: string[]): any
}
