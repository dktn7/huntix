import { CityBreachArena } from '../src/visuals/CityBreachArena.js';
import * as THREE from 'three';

// Minimal test harness to verify 3D/Sprite integration.
async function testArenaIntegration() {
    console.log("Initializing Test Scene...");
    const scene = new THREE.Scene();
    const arena = new CityBreachArena(scene);
    
    try {
        const group = await arena.build();
        console.log("Arena built successfully.");
        
        // Simple heuristic check: Are there meshes in the group?
        if (group.children.length > 0) {
            console.log(`Arena has ${group.children.length} structural components.`);
            return true;
        } else {
            console.error("Arena group is empty!");
            return false;
        }
    } catch (e) {
        console.error("Arena build failed:", e);
        return false;
    }
}

testArenaIntegration().then(success => {
    if (success) {
        console.log("Verification Passed: Arena construction is functional.");
    } else {
        console.error("Verification Failed: Arena construction issues.");
    }
});
