import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/models/property_model.dart';
import '../providers/properties_provider.dart';

class SearchResultsScreen extends ConsumerStatefulWidget {
  const SearchResultsScreen({super.key});

  @override
  ConsumerState<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final state = ref.read(searchStateProvider);
    _searchController.text = state.query ?? state.city ?? '';
  }

  void _onSearch() {
    final query = _searchController.text.trim();
    ref.read(searchStateProvider.notifier).state = PropertySearchState(
      query: query.isEmpty ? null : query,
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(propertiesListProvider);
    final searchState = ref.watch(searchStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: SizedBox(
          height: 40,
          child: TextField(
            controller: _searchController,
            style: const TextStyle(color: Colors.white, fontSize: 15),
            decoration: InputDecoration(
              hintText: 'Search hotels...',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
              filled: true,
              fillColor: Colors.white.withOpacity(0.15),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14),
              prefixIcon: Icon(Icons.search, color: Colors.white.withOpacity(0.7), size: 20),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Colors.white70, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        _onSearch();
                      },
                    )
                  : null,
            ),
            onSubmitted: (_) => _onSearch(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: () => _showFilters(context),
          ),
        ],
      ),
      body: propertiesAsync.when(
        data: (result) {
          if (result.properties.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search_off, size: 64, color: AppColors.textHint),
                  const SizedBox(height: 16),
                  const Text('No hotels found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Text('Try a different search or adjust filters',
                      style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Results count
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${result.total} hotel${result.total != 1 ? "s" : ""} found',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                    ),
                    if (searchState.city != null)
                      Chip(
                        label: Text(searchState.city!, style: const TextStyle(fontSize: 12)),
                        onDeleted: () {
                          ref.read(searchStateProvider.notifier).state = const PropertySearchState();
                        },
                        deleteIconColor: AppColors.textSecondary,
                        visualDensity: VisualDensity.compact,
                      ),
                  ],
                ),
              ),

              // Results list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.only(bottom: 20),
                  itemCount: result.properties.length,
                  itemBuilder: (context, index) {
                    final property = result.properties[index];
                    return _SearchPropertyCard(
                      property: property,
                      onTap: () => context.push('/property/${property.id}'),
                    );
                  },
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  void _showFilters(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _FilterSheet(
        onApply: (filters) {
          ref.read(searchStateProvider.notifier).state = PropertySearchState(
            query: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
            city: filters['city'],
            guests: filters['guests'],
            checkIn: filters['checkIn'],
            checkOut: filters['checkOut'],
          );
          Navigator.pop(ctx);
        },
      ),
    );
  }
}

class _SearchPropertyCard extends StatelessWidget {
  final PropertyModel property;
  final VoidCallback onTap;

  const _SearchPropertyCard({required this.property, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            // Image
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
              child: CachedNetworkImage(
                imageUrl: AppConstants.normalizeServerUrl(property.mainImage),
                width: 120,
                height: 130,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(width: 120, height: 130, color: AppColors.shimmerBase),
              ),
            ),
            // Info
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.name,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on, size: 13, color: AppColors.textSecondary),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            property.city,
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (property.starRating != null) ...[
                          const SizedBox(width: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: List.generate(
                              property.starRating!,
                              (_) => const Icon(Icons.star, size: 12, color: AppColors.starColor),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (property.amenities.isNotEmpty)
                      Text(
                        property.amenities.take(3).join(' · '),
                        style: TextStyle(fontSize: 11, color: AppColors.textHint),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 8),
                    Text(
                      property.formattedPrice,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  final Function(Map<String, dynamic>) onApply;
  const _FilterSheet({required this.onApply});

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  final _cityController = TextEditingController();
  int _guests = 2;
  DateTimeRange? _dateRange;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(width: 40, height: 4, decoration: BoxDecoration(
              color: AppColors.divider, borderRadius: BorderRadius.circular(2),
            )),
          ),
          const SizedBox(height: 20),
          const Text('Filters', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),

          // City
          TextField(
            controller: _cityController,
            decoration: const InputDecoration(
              labelText: 'City',
              hintText: 'e.g. Yangon, Mandalay, Bagan',
              prefixIcon: Icon(Icons.location_city),
            ),
          ),
          const SizedBox(height: 16),

          // Dates
          GestureDetector(
            onTap: () async {
              final range = await showDateRangePicker(
                context: context,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (range != null) setState(() => _dateRange = range);
            },
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Dates',
                prefixIcon: Icon(Icons.calendar_today),
              ),
              child: Text(
                _dateRange != null
                    ? '${_dateRange!.start.toString().split(' ')[0]} → ${_dateRange!.end.toString().split(' ')[0]}'
                    : 'Select check-in & check-out',
                style: TextStyle(
                  color: _dateRange != null ? AppColors.textPrimary : AppColors.textHint,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Guests
          Row(
            children: [
              const Text('Guests', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
              const Spacer(),
              IconButton(
                onPressed: _guests > 1 ? () => setState(() => _guests--) : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('$_guests', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              IconButton(
                onPressed: _guests < 10 ? () => setState(() => _guests++) : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
          const SizedBox(height: 24),

          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                widget.onApply({
                  'city': _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
                  'guests': _guests,
                  'checkIn': _dateRange?.start.toIso8601String().split('T').first,
                  'checkOut': _dateRange?.end.toIso8601String().split('T').first,
                });
              },
              child: const Text('Apply Filters'),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
