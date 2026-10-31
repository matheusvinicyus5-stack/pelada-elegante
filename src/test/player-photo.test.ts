import {describe,it,expect} from 'vitest';
import {decodePhoto,photoPathPattern} from '@/lib/player-photo';
describe('Photo file safety',()=>{
 it('rejects nonimages with an image prefix',()=>expect(()=>decodePhoto('data:image/jpeg;base64,'+btoa('not a real image'))).toThrow());
 it('rejects unsupported image formats',()=>expect(()=>decodePhoto('data:image/svg+xml;base64,'+btoa('<svg/>'))).toThrow());
 it('accepts the actual PNG signature',()=>{const bytes=[137,80,78,71,13,10,26,10,0,0,0,0];expect(decodePhoto('data:image/png;base64,'+btoa(String.fromCharCode(...bytes))).type).toBe('png');});
 it('prevents traversal or arbitrary storage files in image URLs',()=>{expect(photoPathPattern.test('/api/player-photos/../secret')).toBe(false);expect(photoPathPattern.test('/api/player-photos/abc-123.jpeg')).toBe(true);});
});
