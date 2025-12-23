'use client';

import { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import type { PNode, SearchFilters } from '@/types/pnode';
import { cn } from '@/lib/utils';

interface NodeSearchProps {
  nodes: PNode[];
  onFilterChange: (filtered: PNode[]) => void;
  className?: string;
}

export function NodeSearch({ nodes, onFilterChange, className }: NodeSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const countries = useMemo(() =>
    [...new Set(nodes.map(n => n.location?.country).filter(Boolean))] as string[],
    [nodes]
  );

  const cities = useMemo(() =>
    [...new Set(nodes.map(n => n.location?.city).filter(Boolean))] as string[],
    [nodes]
  );

  const versions = useMemo(() =>
    [...new Set(nodes.map(n => n.version))],
    [nodes]
  );

  const applyFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);

    let filtered = [...nodes];

    if (newFilters.query) {
      const query = newFilters.query.toLowerCase();
      filtered = filtered.filter(n =>
        n.pubkey.toLowerCase().includes(query) ||
        n.location?.city?.toLowerCase().includes(query) ||
        n.location?.country?.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query)
      );
    }

    if (newFilters.status?.length) {
      filtered = filtered.filter(n => newFilters.status?.includes(n.status));
    }

    if (newFilters.countries?.length) {
      filtered = filtered.filter(n =>
        n.location && newFilters.countries?.includes(n.location.country)
      );
    }

    if (newFilters.cities?.length) {
      filtered = filtered.filter(n =>
        n.location && newFilters.cities?.includes(n.location.city)
      );
    }

    if (newFilters.performanceTiers?.length) {
      filtered = filtered.filter(n =>
        newFilters.performanceTiers?.includes(n.performance.tier)
      );
    }

    if (newFilters.versions?.length) {
      filtered = filtered.filter(n => newFilters.versions?.includes(n.version));
    }

    if (newFilters.minScore !== undefined) {
      filtered = filtered.filter(n => n.performance.score >= (newFilters.minScore || 0));
    }

    if (newFilters.maxScore !== undefined) {
      filtered = filtered.filter(n => n.performance.score <= (newFilters.maxScore || 100));
    }

    if (newFilters.minLatency !== undefined) {
      filtered = filtered.filter(n => n.metrics.responseTimeMs >= (newFilters.minLatency || 0));
    }

    if (newFilters.maxLatency !== undefined) {
      filtered = filtered.filter(n => n.metrics.responseTimeMs <= (newFilters.maxLatency || 1000));
    }

    if (newFilters.minUptime !== undefined) {
      filtered = filtered.filter(n => n.uptime >= (newFilters.minUptime || 0));
    }

    onFilterChange(filtered);
  }, [nodes, onFilterChange]);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    const newFilters = { ...filters, [key]: value };
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange(nodes);
  };

  const activeFilterCount = Object.values(filters).filter(v =>
    v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="node-search" className="sr-only">Search nodes</label>
          <Input
            id="node-search"
            placeholder="Search by pubkey, city, or country..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value || undefined)}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          {(['online', 'offline', 'degraded'] as const).map(status => (
            <Button
              key={status}
              size="sm"
              variant={filters.status?.includes(status) ? 'default' : 'outline'}
              onClick={() => {
                const current = filters.status || [];
                const newStatus = current.includes(status)
                  ? current.filter(s => s !== status)
                  : [...current, status];
                updateFilter('status', newStatus.length ? newStatus : undefined);
              }}
              className={cn(
                'capitalize',
                status === 'online' && filters.status?.includes(status) && 'bg-green-600 hover:bg-green-700',
                status === 'offline' && filters.status?.includes(status) && 'bg-red-600 hover:bg-red-700',
                status === 'degraded' && filters.status?.includes(status) && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              {status}
            </Button>
          ))}
        </div>

        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2" variant="secondary">{activeFilterCount}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase text-muted-foreground mb-2 block">Country</label>
                <Select
                  value={filters.countries?.[0] || ''}
                  onValueChange={(v) => updateFilter('countries', v ? [v] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All countries</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs uppercase text-muted-foreground mb-2 block">City</label>
                <Select
                  value={filters.cities?.[0] || ''}
                  onValueChange={(v) => updateFilter('cities', v ? [v] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs uppercase text-muted-foreground mb-2 block">Version</label>
                <Select
                  value={filters.versions?.[0] || ''}
                  onValueChange={(v) => updateFilter('versions', v ? [v] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All versions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All versions</SelectItem>
                    {versions.map(version => (
                      <SelectItem key={version} value={version}>{version}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs uppercase text-muted-foreground mb-2 block">Performance Tier</label>
                <div className="flex flex-wrap gap-2">
                  {(['excellent', 'good', 'fair', 'poor'] as const).map(tier => (
                    <label key={tier} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.performanceTiers?.includes(tier) || false}
                        onCheckedChange={(checked) => {
                          const current = filters.performanceTiers || [];
                          const newTiers = checked
                            ? [...current, tier]
                            : current.filter(t => t !== tier);
                          updateFilter('performanceTiers', newTiers.length ? newTiers : undefined);
                        }}
                      />
                      <span className="text-sm capitalize">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase text-muted-foreground mb-2 block">
                  Min Score: {filters.minScore || 0}
                </label>
                <Slider
                  value={[filters.minScore || 0]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => updateFilter('minScore', v > 0 ? v : undefined)}
                />
              </div>

              <div>
                <label className="text-xs uppercase text-muted-foreground mb-2 block">
                  Max Latency: {filters.maxLatency || 500}ms
                </label>
                <Slider
                  value={[filters.maxLatency || 500]}
                  min={0}
                  max={500}
                  step={10}
                  onValueChange={([v]) => updateFilter('maxLatency', v < 500 ? v : undefined)}
                />
              </div>

              <Button onClick={clearFilters} variant="ghost" size="sm" className="w-full">
                Clear All Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {nodes.length} nodes
        {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)`}
      </div>
    </div>
  );
}
